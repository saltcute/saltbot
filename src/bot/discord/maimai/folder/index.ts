import {
    type ApplicationCommandOption,
    ApplicationCommandOptionType,
    AttachmentBuilder,
    ButtonStyle,
    ComponentType,
    type Interaction,
    MessageFlags,
} from "discord.js";
import { BaseError, type DataOrError } from "maidraw";
import { type Folder, FolderPainter, type MaimaiScoreAdapter } from "maidraw/maimai";
import { MaimaiDxNetAdapter, MaimaiDxNetEngAdapter } from "maidraw-gcm-net-adapter/maimai";
import { KamaiTachiScoreAdapter } from "maidraw-kamai-tachi-adapter/maimai";
import { LxnsScoreAdapter } from "maidraw-lxns-adapter/maimai";
import { MaishiftScoreAdapter } from "maidraw-maishift-adapter/maimai";
import sharp from "sharp";
import { client as kasumi } from "@/bot/kook/init/client";
import { Util } from "@/bot/util/index";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";
import { database, otogedb, otogedbIntl } from "../database";
import { GOALS } from "./goals";
import { findFolder, getFolder, getFolderChoices, getVariants, searchFolders } from "./registry";
import { resolveFolder } from "./resolve";
import type { DatabaseKey, FolderDefinition } from "./types";

type Tracker = "kamai" | "maishift" | "lxns" | "gcm-net" | "gcm-net-intl";

const lxns = new LxnsScoreAdapter({
    auth: kasumi.config.getSync("maimai::lxns.token"),
    database,
});
const kamai = new KamaiTachiScoreAdapter({ database });
const maishift = new MaishiftScoreAdapter(database);
const gcmNet = new MaimaiDxNetAdapter({ database: otogedb });
const gcmNetIntl = new MaimaiDxNetEngAdapter({ database: otogedbIntl });

/**
 * Folders are resolved against the database the score adapter uses, as scores are matched to charts by identifier.
 */
const SOURCES: Record<Tracker, { adapter: MaimaiScoreAdapter; database: DatabaseKey }> = {
    kamai: { adapter: kamai, database: "local" },
    maishift: { adapter: maishift, database: "local" },
    lxns: { adapter: lxns, database: "local" },
    "gcm-net": { adapter: gcmNet, database: "otogedb" },
    "gcm-net-intl": { adapter: gcmNetIntl, database: "otogedbIntl" },
};

const PAINTERS: Record<DatabaseKey, FolderPainter> = {
    local: new FolderPainter(database),
    otogedb: new FolderPainter(otogedb),
    otogedbIntl: new FolderPainter(otogedbIntl),
};

/**
 * Layout of the folder element in the themes, used to estimate the height of a drawn folder.
 */
const FOLDER_LAYOUT = {
    horizontalSize: 9,
    rowHeight: 130 + 16,
    titleHeight: 40 + 16,
    gap: 32,
};
/**
 * Height the folders of one image may take. Canvases cannot exceed 32767px on either side,
 * but the images are kept far shorter so each stays under the attachment size limit once encoded.
 */
const MAX_FOLDER_HEIGHT = 14000;
/**
 * Images above this size are sent as JPEG instead of PNG. Discord rejects attachments over 10 MiB.
 */
const MAX_PNG_SIZE = 8 * 1024 * 1024;

export class FolderCommand {
    static readonly DEFAULT_THEME = "jp-magical";
    /**
     * When no source is chosen, the first tracker the user has linked is used, in this order.
     */
    static readonly DEFAULT_TRACKER_ORDER: Tracker[] = ["kamai", "maishift", "lxns", "gcm-net", "gcm-net-intl"];

    static getChoices<T>(payload: unknown, choices: T[], defaults: T): T {
        if (choices.includes(payload as T)) return payload as T;
        else return defaults;
    }

    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "mai") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommand() !== "folder") return ResultTypes.IGNORED;

        const folder = interaction.options.getString("folder", true);
        const goal = interaction.options.getString("goal", false);
        const definition = findFolder(folder, goal);
        if (!definition) {
            const variants = getVariants(folder);
            await interaction.reply({
                content: variants.length
                    ? `Invalid goal for this folder. Please pick one of: ${variants.map((variant) => this.getVariantName(variant.variant)).join(", ")}.`
                    : "Invalid folder. Please pick one from the list.",
                flags: [MessageFlags.Ephemeral],
            });
            return ResultTypes.INVALID_INPUT;
        }
        const theme = interaction.options.getString("theme", false) || this.DEFAULT_THEME;

        const requested = interaction.options.getString("source", false);
        let tracker: Tracker | "none";
        let username: string | undefined;
        if (requested == null) {
            tracker = "none";
            for (const candidate of this.DEFAULT_TRACKER_ORDER) {
                username = await kasumi.config.getOne(`salt::connection.discord.${candidate}.${interaction.user.id}`);
                if (username) {
                    tracker = candidate;
                    break;
                }
            }
        } else {
            tracker = this.getChoices<Tracker | "none">(requested, [...this.DEFAULT_TRACKER_ORDER, "none"], "none");
            if (tracker !== "none") {
                username = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${interaction.user.id}`);
                if (!username) {
                    await interaction.reply({
                        content:
                            tracker === "gcm-net" || tracker === "gcm-net-intl"
                                ? `Please link your Sega ID using \`/mai link ${tracker}\``
                                : `Please link your ${tracker} account first, by using \`/mai link\` or selecting "remember my username" after generating a Best 50 chart.`,
                        flags: [MessageFlags.Ephemeral],
                    });
                    return ResultTypes.INVALID_USERNAME;
                }
            }
        }
        if (tracker === "gcm-net" && gcmNet.maintenanceSchedule.isMaintenance()) {
            await interaction.reply({ content: gcmNet.allNetMaintenanceError.getDiscordMarkdownContent() });
            return ResultTypes.ERROR;
        }
        if (tracker === "gcm-net-intl" && gcmNetIntl.maintenanceSchedule.isMaintenance()) {
            await interaction.reply({ content: gcmNetIntl.allNetMaintenanceError.getDiscordMarkdownContent() });
            return ResultTypes.ERROR;
        }

        await interaction.deferReply();

        const result = await this.draw(definition, tracker, username, theme, false);
        if (result.err) {
            await Util.reportError(interaction, result.err);
            return result.err.type === "empty-folder" ? ResultTypes.ERROR : ResultTypes.TRACKER_BAD_RESPONSE;
        } else {
            await interaction.editReply({
                content: this.getContent(definition, false),
                files: this.getAttachments(result.data),
                components: definition.compact
                    ? [
                          {
                              type: 1,
                              components: [
                                  {
                                      type: ComponentType.Button,
                                      label: "View full image",
                                      style: ButtonStyle.Primary,
                                      customId: `maimai::folder.full.${tracker},${theme},${definition.id}`,
                                  },
                              ],
                          },
                      ]
                    : [],
            });
            return ResultTypes.GENERATE_SUCCESS;
        }
    });

    static readonly BUTTON_HANDLER = Telemetry.discordMiddleware(async (interaction: Interaction) => {
        if (!interaction.isButton()) return ResultTypes.IGNORED;
        if (!interaction.customId.startsWith("maimai::folder.full.")) return ResultTypes.IGNORED;

        const [trackerRaw, theme, id] = interaction.customId.replace("maimai::folder.full.", "").split(",");
        const tracker = this.getChoices<Tracker | "none">(trackerRaw, [...this.DEFAULT_TRACKER_ORDER, "none"], "none");
        const definition = getFolder(id);
        if (!definition || !theme) return ResultTypes.IGNORED;
        const owner = interaction.message.interactionMetadata?.user.id;
        if (owner !== interaction.user.id) {
            await interaction.reply({
                content: "You can't change someone else's folder.",
                flags: [MessageFlags.Ephemeral],
            });
            return ResultTypes.IGNORED;
        }
        let username: string | undefined;
        if (tracker !== "none") {
            username = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${owner}`);
            if (!username) {
                await interaction.reply({
                    content: "The tracker account used for this folder is no longer linked.",
                    flags: [MessageFlags.Ephemeral],
                });
                return ResultTypes.INVALID_USERNAME;
            }
        }

        // Remove the button first, so it cannot be clicked again while the full image is drawn.
        await interaction.update({ components: [] });
        const result = await this.draw(definition, tracker, username, theme, true);
        if (result.err) {
            await Util.reportError(interaction, result.err);
            return ResultTypes.TRACKER_BAD_RESPONSE;
        }
        await interaction
            .editReply({
                content: this.getContent(definition, true),
                files: this.getAttachments(result.data),
                components: [],
            })
            .catch(() => {});
        return ResultTypes.GENERATE_SUCCESS;
    });

    /**
     * Draw a folder collection with the scores of `username` on `tracker`, or without scores when there is no tracker.
     *
     * @param full Draw every chart, instead of only the `compact` ones of the collection.
     */
    static async draw(
        definition: FolderDefinition,
        tracker: Tracker | "none",
        username: string | undefined,
        theme: string,
        full: boolean,
    ): Promise<DataOrError<Buffer[]>> {
        const databaseKey = tracker === "none" ? "local" : SOURCES[tracker].database;
        const { folders } = await resolveFolder(definition, databaseKey, full);
        if (!folders.length) {
            return { err: new BaseError("saltbot", "empty-folder", `Folder "${definition.id}" has no charts available in ${databaseKey}.`) };
        }
        const painter = PAINTERS[databaseKey];
        const images: Buffer[] = [];
        // Drawn one after another, so the tracker is not hit by every chunk at once.
        for (const chunk of FolderCommand.chunkFolders(folders)) {
            const result =
                tracker !== "none" && username
                    ? await painter.drawWithScoreSource(SOURCES[tracker].adapter, { username, folders: chunk }, { theme })
                    : await painter.draw({ username: "maimai", rating: 0, folders: chunk, scores: {} }, { theme });
            if (result.err) return { err: result.err };
            images.push(
                result.data.length > MAX_PNG_SIZE
                    ? await sharp(result.data, { limitInputPixels: false }).jpeg({ quality: 85 }).toBuffer()
                    : result.data,
            );
        }
        return { data: images };
    }

    /**
     * Split folders into groups that each fit in one canvas. A folder too tall on its own is split into parts.
     */
    static chunkFolders(folders: Folder[]): Folder[][] {
        const { horizontalSize, rowHeight, titleHeight, gap } = FOLDER_LAYOUT;
        const getHeight = (folder: Folder) => titleHeight + Math.max(1, Math.ceil(folder.elements.length / horizontalSize)) * rowHeight + gap;
        const maxRows = Math.floor((MAX_FOLDER_HEIGHT - titleHeight - gap) / rowHeight);
        const perPart = maxRows * horizontalSize;

        const parts = folders.flatMap((folder) => {
            if (folder.elements.length <= perPart) return [folder];
            const count = Math.ceil(folder.elements.length / perPart);
            return Array.from({ length: count }, (_, i) => ({
                ...folder,
                title: `${folder.title} (${i + 1}/${count})`,
                elements: folder.elements.slice(i * perPart, (i + 1) * perPart),
            }));
        });

        const chunks: Folder[][] = [];
        let current: Folder[] = [];
        let height = 0;
        for (const folder of parts) {
            const folderHeight = getHeight(folder);
            if (current.length && height + folderHeight > MAX_FOLDER_HEIGHT) {
                chunks.push(current);
                current = [];
                height = 0;
            }
            current.push(folder);
            height += folderHeight;
        }
        if (current.length) chunks.push(current);
        return chunks;
    }

    /**
     * One attachment per drawn image, numbered when there are several.
     */
    static getAttachments(images: Buffer[]): AttachmentBuilder[] {
        return images.map((image, i) => {
            // JPEG files start with FF D8.
            const extension = image[0] === 0xff && image[1] === 0xd8 ? "jpg" : "png";
            return new AttachmentBuilder(image, { name: images.length > 1 ? `result-${i + 1}.${extension}` : `result.${extension}` });
        });
    }

    /**
     * Text sent along the image, e.g. `"maimai DX CiRCLE (International) SSS 丸将"`.
     */
    static getContent(definition: FolderDefinition, full: boolean): string {
        return [definition.title, definition.plate, full && definition.compact ? "(full)" : null].filter(Boolean).join(" ");
    }

    static readonly AUTOCOMPLETE_HANDLER = async (interaction: Interaction) => {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "mai") return;
        if (interaction.options.getSubcommand() !== "folder") return;

        const focused = interaction.options.getFocused(true);
        if (focused.name === "folder") {
            await interaction.respond(
                searchFolders(focused.value)
                    .slice(0, 25)
                    .map((choice) => ({ name: choice.name, value: choice.value })),
            );
        } else if (focused.name === "goal") {
            const query = focused.value.toLowerCase();
            await interaction.respond(
                getVariants(interaction.options.getString("folder", false) ?? "")
                    .map((variant) => ({ name: this.getVariantName(variant.variant), value: variant.variant ?? "" }))
                    .filter((choice) => !query || choice.name.toLowerCase().includes(query) || choice.value.includes(query))
                    .slice(0, 25),
            );
        }
    };

    static getVariantName(variant?: string): string {
        return (variant && GOALS[variant as keyof typeof GOALS]?.name) || variant || "";
    }

    static readonly themes = [
        {
            name: "maimai でらっくす MAGiCAL (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす MAGiCAL（日服）",
                "zh-TW": "maimai でらっくす MAGiCAL（日本）",
            },
            value: "jp-magical",
        },
    ];

    static getCommand(): ApplicationCommandOption[] {
        if (!getFolderChoices().length) return [];
        return [
            {
                type: 1,
                name: "folder",
                description: "Check your progress on a folder of charts.",
                descriptionLocalizations: {
                    "zh-CN": "查看谱面合集的完成进度。",
                    "zh-TW": "檢視譜面合集的完成進度。",
                },
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "folder",
                        nameLocalizations: {
                            "zh-CN": "合集",
                            "zh-TW": "合集",
                        },
                        description: "The folder to check.",
                        descriptionLocalizations: {
                            "zh-CN": "要查看的谱面合集。",
                            "zh-TW": "要檢視的譜面合集。",
                        },
                        required: true,
                        autocomplete: true,
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "goal",
                        nameLocalizations: {
                            "zh-CN": "目标",
                            "zh-TW": "目標",
                        },
                        description: "The goal to check the folder against, if it has several. (Defaults to the first one)",
                        descriptionLocalizations: {
                            "zh-CN": "谱面合集的完成目标，如有多个可选。（默认为第一个）",
                            "zh-TW": "譜面合集的完成目標，如有多個可選。（預設為第一個）",
                        },
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "source",
                        nameLocalizations: {
                            "zh-CN": "来源",
                            "zh-TW": "來源",
                        },
                        description: "The score tracker to use for the folder. (Defaults to the first linked tracker)",
                        descriptionLocalizations: {
                            "zh-CN": "生成图片使用的查分器。（默认为第一个已绑定的查分器）",
                            "zh-TW": "生成圖片使用的查分器。（預設為第一個已綁定的查分器）",
                        },
                        choices: [
                            { name: "Kamaitachi", value: "kamai" },
                            { name: "Maishift", value: "maishift" },
                            {
                                name: "LXNS",
                                value: "lxns",
                                nameLocalizations: {
                                    "zh-CN": "落雪查分器",
                                    "zh-TW": "LXNS",
                                },
                            },
                            {
                                name: "maimai DX NET (Japan)",
                                value: "gcm-net",
                                nameLocalizations: {
                                    "zh-CN": "maimai DX NET（日服）",
                                    "zh-TW": "maimai DX NET（日本）",
                                },
                            },
                            {
                                name: "maimai DX NET (International)",
                                value: "gcm-net-intl",
                                nameLocalizations: {
                                    "zh-CN": "maimai DX NET（国际服）",
                                    "zh-TW": "maimai DX NET（國際）",
                                },
                            },
                            {
                                name: "None",
                                nameLocalizations: {
                                    "zh-CN": "无",
                                    "zh-TW": "無",
                                },
                                value: "none",
                            },
                        ],
                        required: false,
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: "theme",
                        nameLocalizations: {
                            "zh-CN": "主题",
                            "zh-TW": "主題",
                        },
                        description: "Choose from a variety of themes for your folder.",
                        descriptionLocalizations: {
                            "zh-CN": "选择合集图片的主题。",
                            "zh-TW": "選擇合集圖像的主題。",
                        },
                        choices: FolderCommand.themes,
                    },
                ],
            },
        ];
    }
}
