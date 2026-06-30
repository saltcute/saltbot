import { ApplicationCommandOptionType, AttachmentBuilder, type Interaction, MessageFlags } from "discord.js";
import { BaseError, type DataOrError } from "maidraw";
import { Best50Painter } from "maidraw/maimai";
import { MaimaiDxNetAdapter, MaimaiDxNetEngAdapter } from "maidraw-gcm-net-adapter/maimai";
import { KamaiTachiScoreAdapter } from "maidraw-kamai-tachi-adapter/maimai";
import { LxnsScoreAdapter } from "maidraw-lxns-adapter/maimai";
import { MaishiftScoreAdapter } from "maidraw-maishift-adapter/maimai";
import { client as kasumi } from "@/bot/kook/init/client";
import { Util } from "@/bot/util/index";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";
import { database, otogedb, otogedbIntl } from "../database";

const lxns = new LxnsScoreAdapter({
    auth: kasumi.config.getSync("maimai::lxns.token"),
    database,
});
const kamai = new KamaiTachiScoreAdapter({ database });
const maishift = new MaishiftScoreAdapter(database);
const gcmNet = new MaimaiDxNetAdapter({ database: otogedb });
const gcmNetIntl = new MaimaiDxNetEngAdapter({ database: otogedbIntl });
// const divingfish = new MaiDraw.Maimai.Adapters.DivingFish({
//     auth: kasumi.config.getSync("maimai::divingFish.token"),
// });

const painter = new Best50Painter(database);
const otogedbPainter = new Best50Painter(otogedb);
const otogedbIntlPainter = new Best50Painter(otogedbIntl);

export class Best50ChartCommand {
    private static readonly AVAILABLE_VERSION_THEME = [
        "jp-finale",
        "jp-buddies",
        "jp-buddiesplus",
        "jp-prism",
        "jp-prismplus",
        "jp-circle",
        "jp-circleplus",
        "cn-2024",
        "cn-2025",
        "cn-2026",
    ];
    private static readonly DEFAULT_VERSION_BY_TRACKER = {
        kamai: "jp-prismplus",
        lxns: "cn-2026",
        divingfish: "cn-2026",
        maishift: "jp-circle",
        "gcm-net": "jp-circleplus",
        "gcm-net-intl": "jp-circle",
    };
    private static readonly DEFAULT_THEME_BY_TRACKER = {
        kamai: "jp-prismplus-landscape",
        lxns: "cn-2026-landscape",
        divingfish: "cn-2026-landscape",
        maishift: "jp-circle-landscape",
        "gcm-net": "jp-circleplus-landscape",
        "gcm-net-intl": "jp-circle-landscape",
    };
    private static readonly DEFAULT_USE_TRACKER_PROFILE_PICTURE = true;

    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "mai") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "b50") return ResultTypes.IGNORED;

        let result: DataOrError<Buffer>,
            useBrainrot = false;

        const tracker = interaction.options.getSubcommand();
        if (
            !(
                tracker === "kamai" ||
                tracker === "divingfish" ||
                tracker === "lxns" ||
                tracker === "maishift" ||
                tracker === "gcm-net" ||
                tracker === "gcm-net-intl"
            )
        ) {
            await interaction.reply({
                content: "Invalid tracker. Please try again.",
                flags: [MessageFlags.Ephemeral],
            });
            return ResultTypes.INVALID_TRACKER;
        }
        const version = interaction.options.getString("version", false) || this.DEFAULT_VERSION_BY_TRACKER[tracker];
        const theme =
            interaction.options.getString("theme", false) ||
            (Util.isAprilFools()
                ? "salt-2026-landscape"
                : version && this.AVAILABLE_VERSION_THEME.includes(version)
                  ? `${version}-landscape`
                  : this.DEFAULT_THEME_BY_TRACKER[tracker]);
        const pfpOption = interaction.options.getBoolean("use_profile_picture", false);
        const useProfilePicture = pfpOption == null ? this.DEFAULT_USE_TRACKER_PROFILE_PICTURE : pfpOption;
        const showRecentUpscore = interaction.options.getBoolean("show_recent_upscore", false);

        let username: string | null = null;
        switch (tracker) {
            case "kamai": {
                username = interaction.options.getString("user");
                break;
            }
            case "divingfish": {
                username = interaction.options.getString("username");
                break;
            }
            case "lxns": {
                username = interaction.options.getString("friendcode");
                break;
            }
            case "maishift": {
                username = interaction.options.getString("username");
                break;
            }
        }
        const mention = interaction.options.getUser("dox");
        if (username == null) {
            if (mention) {
                const dbUsername = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${mention.id}`);
                if (!dbUsername) {
                    await interaction.reply({
                        content: `This user has not connected their ${tracker} ${tracker === "lxns" ? "friend code" : "username"} to their Discord account.`,
                        ephemeral: true,
                    });
                    return ResultTypes.INVALID_USERNAME;
                } else username = dbUsername;
            } else {
                const dbUsername = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${interaction.user.id}`);
                if (!dbUsername) {
                    if (tracker === "gcm-net" || tracker === "gcm-net-intl") {
                        await interaction.reply({
                            content: `Please link your Sega ID using \`/mai link ${tracker}\``,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: `Please provide your ${tracker === "lxns" ? "friend code" : "username"}. To use without a ${tracker === "lxns" ? "friend code" : "username"}, you need to select "remember my username" after generating a chart or use \`/mai link\` to link your account.`,
                            ephemeral: true,
                        });
                    }
                    return ResultTypes.INVALID_USERNAME;
                } else username = dbUsername;
            }
        }
        await interaction.deferReply();
        switch (tracker) {
            case "kamai": {
                let kamaiInstance: KamaiTachiScoreAdapter;
                switch (version) {
                    case "jp-maimai":
                        kamaiInstance = kamai.versions().maimai();
                        break;
                    case "jp-maimaiplus":
                        kamaiInstance = kamai.versions().maimaiPlus();
                        break;
                    case "jp-green":
                        kamaiInstance = kamai.versions().green();
                        break;
                    case "jp-greenplus":
                        kamaiInstance = kamai.versions().greenPlus();
                        break;
                    case "jp-orange":
                        kamaiInstance = kamai.versions().orange();
                        break;
                    case "jp-orangeplus":
                        kamaiInstance = kamai.versions().orangePlus();
                        break;
                    case "jp-pink":
                        kamaiInstance = kamai.versions().pink();
                        break;
                    case "jp-pinkplus":
                        kamaiInstance = kamai.versions().pinkPlus();
                        break;
                    case "jp-murasaki":
                        kamaiInstance = kamai.versions().murasaki();
                        break;
                    case "jp-murasakiplus":
                        kamaiInstance = kamai.versions().murasakiPlus();
                        break;
                    case "jp-milk":
                        kamaiInstance = kamai.versions().milk();
                        break;
                    case "jp-milkplus":
                        kamaiInstance = kamai.versions().milkPlus();
                        break;
                    case "jp-finale":
                        kamaiInstance = kamai.versions().finale();
                        break;
                    case "jp-dx":
                        kamaiInstance = kamai.versions().dx();
                        break;
                    case "ex-dx":
                        kamaiInstance = kamai.versions().dx("EX");
                        break;
                    case "cn-dx":
                        kamaiInstance = kamai.versions().chinese().dx();
                        break;
                    case "jp-dxplus":
                        kamaiInstance = kamai.versions().dxPlus();
                        break;
                    case "ex-dxplus":
                        kamaiInstance = kamai.versions().dxPlus("EX");
                        break;
                    case "jp-splash":
                        kamaiInstance = kamai.versions().splash();
                        break;
                    case "ex-splash":
                        kamaiInstance = kamai.versions().splash("EX");
                        break;
                    case "cn-2021":
                        kamaiInstance = kamai.versions().chinese().dx2021();
                        break;
                    case "jp-splashplus":
                        kamaiInstance = kamai.versions().splashPlus();
                        break;
                    case "ex-splashplus":
                        kamaiInstance = kamai.versions().splashPlus("EX");
                        break;
                    case "jp-universe":
                        kamaiInstance = kamai.versions().universe();
                        break;
                    case "ex-universe":
                        kamaiInstance = kamai.versions().universe("EX");
                        break;
                    case "cn-2022":
                        kamaiInstance = kamai.versions().chinese().dx2022();
                        break;
                    case "jp-universeplus":
                        kamaiInstance = kamai.versions().universePlus();
                        break;
                    case "ex-universeplus":
                        kamaiInstance = kamai.versions().universePlus("EX");
                        break;
                    case "jp-festival":
                        kamaiInstance = kamai.versions().festival();
                        break;
                    case "ex-festival":
                        kamaiInstance = kamai.versions().festival("EX");
                        break;
                    case "cn-2023":
                        kamaiInstance = kamai.versions().chinese().dx2023();
                        break;
                    case "jp-festivalplus":
                        kamaiInstance = kamai.versions().festivalPlus();
                        break;
                    case "ex-festivalplus":
                        kamaiInstance = kamai.versions().festivalPlus("EX");
                        break;
                    case "jp-buddies":
                        kamaiInstance = kamai.versions().buddies();
                        break;
                    case "ex-buddies":
                        kamaiInstance = kamai.versions().buddies("EX");
                        break;
                    case "cn-2024":
                        kamaiInstance = kamai.versions().chinese().dx2024();
                        break;
                    case "jp-buddiesplus":
                        kamaiInstance = kamai.versions().buddiesPlus();
                        break;
                    case "ex-buddiesplus":
                        kamaiInstance = kamai.versions().buddiesPlus("EX");
                        break;
                    case "jp-prism":
                        kamaiInstance = kamai.versions().prism();
                        break;
                    case "ex-prism":
                        kamaiInstance = kamai.versions().prism("EX");
                        break;
                    case "cn-2025":
                        kamaiInstance = kamai.versions().chinese().dx2025();
                        break;
                    case "jp-prismplus":
                        kamaiInstance = kamai.versions().prismPlus();
                        break;
                    case "ex-prismplus":
                        kamaiInstance = kamai.versions().prismPlus("EX");
                        break;
                    case "cn-2026":
                        kamaiInstance = kamai.versions().chinese().dx2026();
                        break;
                    case "jp-circle":
                        kamaiInstance = kamai.versions().circle();
                        break;
                    case "ex-circle":
                        kamaiInstance = kamai.versions().circle("EX");
                        break;
                    case "jp-circleplus":
                        kamaiInstance = kamai.versions().circlePlus();
                        break;
                    case "ex-circleplus":
                        kamaiInstance = kamai.versions().circlePlus("EX");
                        break;
                    default:
                        kamaiInstance = kamai;
                        break;
                }
                const { data: profile, err: perr } = await kamaiInstance.getPlayerInfo(username);
                if (perr) {
                    await Util.reportError(interaction, perr);
                    return ResultTypes.ERROR;
                }
                const { data: score, err: serr } = await kamaiInstance.getPlayerBest50(username);
                if (serr) {
                    await Util.reportError(interaction, serr);
                    return ResultTypes.ERROR;
                } else {
                    if ([...score.new, ...score.old].findIndex((v) => v.chart.title === "Baqeela") !== -1) {
                        useBrainrot = true;
                    }
                    if (showRecentUpscore === true) {
                        await Promise.all(
                            [...score.new, ...score.old].map(async (v) => {
                                // Get kt score history
                                const chardId = v.optionalData?.kt?.chartId;
                                if (chardId) {
                                    const ktScore = await kamaiInstance.getScoreHistory(username, chardId);
                                    if (ktScore?.success) {
                                        const recent = ktScore.body
                                            .sort((a, b) => a.timeAchieved - b.timeAchieved)
                                            .find((v1) => v1.scoreData.percent >= v.achievement);
                                        if (recent) {
                                            const freshBorder = 1 * 24 * 60 * 60 * 1000; // 1 day
                                            const deadCutoff = 180 * 24 * 60 * 60 * 1000; // 180 days

                                            const timeDiff = Date.now() - recent.timeAchieved;
                                            if (!v.optionalData) v.optionalData = {};
                                            if (timeDiff < freshBorder) {
                                                v.optionalData.scale = 0;
                                            } else if (timeDiff > deadCutoff) {
                                                v.optionalData.scale = 1;
                                            } else {
                                                const rawScale = (timeDiff - freshBorder) / (deadCutoff - freshBorder);
                                                const midpointDay = 15 * 24 * 60 * 60 * 1000; // 15 days
                                                const midpointScale = midpointDay / (deadCutoff - freshBorder);
                                                v.optionalData.scale =
                                                    rawScale < midpointScale
                                                        ? (rawScale / midpointScale) * 0.3
                                                        : 0.3 + ((rawScale - midpointScale) / (1 - midpointScale)) * 0.3;
                                            }
                                        }
                                    }
                                }
                            }),
                        );
                    }
                    // console.dir(score.new, { depth: null });
                    result = await painter.draw(
                        {
                            username: profile.name,
                            rating: profile.rating,
                            newScores: score.new,
                            oldScores: score.old,
                        },
                        {
                            theme,
                            profilePicture: await (async () => {
                                if (!useProfilePicture) return undefined;
                                const { data: pfp, err } = await kamaiInstance.getPlayerProfilePicture(username);
                                if (err) return undefined;
                                return pfp;
                            })(),
                        },
                    );
                }
                break;
            }
            case "divingfish": {
                // result = await painter.drawWithScoreSource(
                //     divingfish,
                //     { username },
                //     { theme }
                // );
                result = { err: new BaseError("saltbot", "unsupported-action", "Diving-fish is not supported") };
                break;
            }
            case "lxns": {
                result = await painter.drawWithScoreSource(
                    lxns,
                    { username },
                    {
                        theme,
                        profilePicture: useProfilePicture ? undefined : null,
                    },
                );
                break;
            }
            case "maishift": {
                result = await painter.drawWithScoreSource(
                    maishift,
                    { username },
                    {
                        theme,
                        profilePicture: useProfilePicture ? undefined : null,
                    },
                );
                break;
            }
            case "gcm-net": {
                result = await otogedbPainter.drawWithScoreSource(
                    gcmNet,
                    { username },
                    {
                        theme,
                        // profilePicture: useProfilePicture ? undefined : null,
                    },
                );
                break;
            }
            case "gcm-net-intl": {
                result = await otogedbIntlPainter.drawWithScoreSource(
                    gcmNetIntl,
                    { username },
                    {
                        theme,
                        // profilePicture: useProfilePicture ? undefined : null,
                    },
                );
                break;
            }
        }
        if (result.err) {
            await Util.reportError(interaction, result.err);
            return ResultTypes.TRACKER_BAD_RESPONSE;
        } else {
            await interaction.editReply({
                content: "",
                files: [
                    new AttachmentBuilder(result.data, {
                        name: "result.png",
                    }),
                ],
            });
            const link = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${interaction.user.id}`);
            const ignore = await kasumi.config.getOne(`salt::connection.discord.ignore.${tracker}.${interaction.user.id}`);
            if (!link && !ignore && !mention) {
                await interaction.followUp({
                    content: `Do you want to link this user on \`${tracker}\` to your discord account?`,
                    ephemeral: true,
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: "Onegai shimasu",
                                    style: 1,
                                    customId: `maimai::tracker.link.${tracker}.${interaction.user.id}.${username}`,
                                },
                                {
                                    type: 2,
                                    label: "Later",
                                    style: 3,
                                    customId: `maimai::tracker.link.nocomment`,
                                },
                                {
                                    type: 2,
                                    label: "GO MIND YOUR OWN BUSINESS",
                                    style: 4,
                                    customId: `maimai::tracker.link.ignore.${tracker}.${interaction.user.id}`,
                                },
                            ],
                        },
                    ],
                });
            }
            if (useBrainrot) {
                const content = Util.brainrotGenerator();
                if (content) {
                    await interaction.followUp({
                        content,
                    });
                    return ResultTypes.GENERATE_BAQEELA_SUCCESS;
                }
            }
            return ResultTypes.GENERATE_SUCCESS;
        }
    });

    static readonly AUTOCOMPLETE_HANDLER = async (interaction: Interaction) => {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "mai") return;
        if (interaction.options.getSubcommandGroup() !== "b50") return;

        const focused = interaction.options.getFocused(true);
        let source: { name: string; nameLocalizations: Record<string, string>; value: string }[];
        if (focused.name === "theme") source = this.themes;
        else if (focused.name === "version") source = this.versions;
        else return;

        const locale = interaction.locale as string;
        const localizedName = (entry: (typeof source)[number]) => entry.nameLocalizations[locale] ?? entry.name;

        const query = focused.value.toLowerCase();
        const result = source
            .filter((entry) =>
                query
                    ? localizedName(entry).toLowerCase().includes(query) ||
                      entry.name.toLowerCase().includes(query) ||
                      entry.value.toLowerCase().includes(query)
                    : true,
            )
            .slice(0, 25)
            .map((entry) => ({ name: localizedName(entry), value: entry.value }));

        await interaction.respond(result);
    };

    static readonly themes = [
        {
            name: "maimai でらっくす CiRCLE PLUS (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす CiRCLE PLUS（日服），横向",
                "zh-TW": "maimai でらっくす CiRCLE PLUS（日本），橫向",
            },
            value: "jp-circleplus-landscape",
        },
        {
            name: "maimai でらっくす CiRCLE PLUS (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす CiRCLE PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす CiRCLE PLUS（日本），縱向",
            },
            value: "jp-circleplus-portrait",
        },
        {
            name: "maimai でらっくす CiRCLE (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす CiRCLE（日服），横向",
                "zh-TW": "maimai でらっくす CiRCLE（日本），橫向",
            },
            value: "jp-circle-landscape",
        },
        {
            name: "maimai でらっくす CiRCLE (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす CiRCLE（日服），纵向",
                "zh-TW": "maimai でらっくす CiRCLE（日本），縱向",
            },
            value: "jp-circle-portrait",
        },
        {
            name: "maimai でらっくす PRiSM PLUS (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服），横向",
                "zh-TW": "maimai でらっくす PRiSM PLUS（日本），橫向",
            },
            value: "jp-prismplus-landscape",
        },
        {
            name: "maimai でらっくす PRiSM PLUS (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす PRiSM PLUS（日本），縱向",
            },
            value: "jp-prismplus-portrait",
        },
        {
            name: "maimai でらっくす PRiSM (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服），横向",
                "zh-TW": "maimai でらっくす PRiSM（日本），橫向",
            },
            value: "jp-prism-landscape",
        },
        {
            name: "maimai でらっくす PRiSM (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服），纵向",
                "zh-TW": "maimai でらっくす PRiSM（日本），縱向",
            },
            value: "jp-prism-portrait",
        },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服），横向",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本），橫向",
            },
            value: "jp-buddiesplus-landscape",
        },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本），縱向",
            },
            value: "jp-buddiesplus-portrait",
        },
        {
            name: "maimai でらっくす BUDDiES (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす BUDDiES（日服），横向",
                "zh-TW": "maimai でらっくす BUDDiES（日本），橫向",
            },
            value: "jp-buddies-landscape",
        },
        {
            name: "maimai でらっくす BUDDiES (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす BUDDiES（日服），纵向",
                "zh-TW": "maimai でらっくす BUDDiES（日本），縱向",
            },
            value: "jp-buddies-portrait",
        },
        {
            name: "maimai FiNALE (Japan), landscape",
            nameLocalizations: {
                "zh-CN": "maimai FiNALE（日服），横向",
                "zh-TW": "maimai FiNALE（日本），橫向",
            },
            value: "jp-finale-landscape",
        },
        {
            name: "maimai FiNALE (Japan), portrait",
            nameLocalizations: {
                "zh-CN": "maimai FiNALE（日服），纵向",
                "zh-TW": "maimai FiNALE（日本），縱向",
            },
            value: "jp-finale-portrait",
        },
        {
            name: "舞萌DX 2024 (China), landscape",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2024（国服），横向",
                "zh-TW": "舞萌DX 2024（中國），橫向",
            },
            value: "cn-2024-landscape",
        },
        {
            name: "舞萌DX 2024 (China), portrait",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2024（国服），纵向",
                "zh-TW": "舞萌DX 2024（中國），縱向",
            },
            value: "cn-2024-portrait",
        },
        {
            name: "舞萌DX 2025 (China), landscape",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2025（国服），横向",
                "zh-TW": "舞萌DX 2025（中國），橫向",
            },
            value: "cn-2025-landscape",
        },
        {
            name: "舞萌DX 2025 (China), portrait",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2025（国服），纵向",
                "zh-TW": "舞萌DX 2025（中國），縱向",
            },
            value: "cn-2025-portrait",
        },
        {
            name: "舞萌DX 2026 (China), landscape",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2026（国服），横向",
                "zh-TW": "舞萌DX 2026（中國），橫向",
            },
            value: "cn-2026-landscape",
        },
        {
            name: "舞萌DX 2026 (China), portrait",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2026（国服），纵向",
                "zh-TW": "舞萌DX 2026（中國），縱向",
            },
            value: "cn-2026-portrait",
        },
    ];

    static readonly versions = [
        {
            name: "maimai でらっくす CiRCLE PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす CiRCLE PLUS（日服）",
                "zh-TW": "maimai でらっくす CiRCLE PLUS（日本）",
            },
            value: "jp-circleplus",
        },
        {
            name: "maimai でらっくす CiRCLE (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす CiRCLE（日服）",
                "zh-TW": "maimai でらっくす CiRCLE（日本）",
            },
            value: "jp-circle",
        },
        {
            name: "maimai でらっくす PRiSM PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服）",
                "zh-TW": "maimai でらっくす PRiSM PLUS（日本）",
            },
            value: "jp-prismplus",
        },
        {
            name: "舞萌DX 2026 (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2026（国服）",
                "zh-TW": "舞萌DX 2026（中國）",
            },
            value: "cn-2026",
        },
        {
            name: "maimai でらっくす PRiSM (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服）",
                "zh-TW": "maimai でらっくす PRiSM（日本）",
            },
            value: "jp-prism",
        },
        {
            name: "舞萌DX 2025 (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2025（国服）",
                "zh-TW": "舞萌DX 2025（中國）",
            },
            value: "cn-2025",
        },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服）",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本）",
            },
            value: "jp-buddiesplus",
        },
        {
            name: "maimai でらっくす BUDDiES (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす BUDDiES （日服）",
                "zh-TW": "maimai でらっくす BUDDiES （日本）",
            },
            value: "jp-buddies",
        },
        {
            name: "舞萌DX 2024 (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2024（国服）",
                "zh-TW": "舞萌DX 2024（中國）",
            },
            value: "cn-2024",
        },
        {
            name: "maimai でらっくす FESTiVAL PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす FESTiVAL PLUS（日服）",
                "zh-TW": "maimai でらっくす FESTiVAL PLUS（日本）",
            },
            value: "jp-festivalplus",
        },
        {
            name: "maimai でらっくす FESTiVAL (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす FESTiVAL （日服）",
                "zh-TW": "maimai でらっくす FESTiVAL （日本）",
            },
            value: "jp-festival",
        },
        {
            name: "舞萌DX 2023 (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2023（国服）",
                "zh-TW": "舞萌DX 2023（中國）",
            },
            value: "cn-2023",
        },
        {
            name: "maimai でらっくす UNiVERSE PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす UNiVERSE PLUS（日服）",
                "zh-TW": "maimai でらっくす UNiVERSE PLUS（日本）",
            },
            value: "jp-universeplus",
        },
        {
            name: "maimai でらっくす UNiVERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす UNiVERSE （日服）",
                "zh-TW": "maimai でらっくす UNiVERSE （日本）",
            },
            value: "jp-universe",
        },
        {
            name: "舞萌DX 2022 (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2022（国服）",
                "zh-TW": "舞萌DX 2022（中國）",
            },
            value: "cn-2022",
        },
        {
            name: "maimai でらっくす Splash PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす Splash PLUS（日服）",
                "zh-TW": "maimai でらっくす Splash PLUS（日本）",
            },
            value: "jp-splashplus",
        },
        {
            name: "maimai でらっくす Splash (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす Splash （日服）",
                "zh-TW": "maimai でらっくす Splash （日本）",
            },
            value: "jp-splash",
        },
        {
            name: "舞萌DX 2021 (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX 2021（国服）",
                "zh-TW": "舞萌DX 2021（中國）",
            },
            value: "cn-2021",
        },
        {
            name: "maimai でらっくす PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす PLUS（日服）",
                "zh-TW": "maimai でらっくす PLUS（日本）",
            },
            value: "jp-dxplus",
        },
        {
            name: "maimai でらっくす (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai でらっくす（日服）",
                "zh-TW": "maimai でらっくす（日本）",
            },
            value: "jp-dx",
        },
        {
            name: "舞萌DX (China)",
            nameLocalizations: {
                "zh-CN": "舞萌DX（国服）",
                "zh-TW": "舞萌DX（中國）",
            },
            value: "cn-dx",
        },
        {
            name: "maimai FiNALE (Japan)",
            nameLocalizations: {
                "zh-CN": "maimai FiNALE（日服）",
                "zh-TW": "maimai FiNALE（日本）",
            },
            value: "jp-finale",
        },
        // {
        //     name: "maimai MiLK PLUS (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai MiLK PLUS（日服）",
        //         "zh-TW": "maimai MiLK PLUS（日本）",
        //     },
        //     value: "jp-milkplus",
        // },
        // {
        //     name: "maimai MiLK (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai MiLK（日服）",
        //         "zh-TW": "maimai MiLK（日本）",
        //     },
        //     value: "jp-milk",
        // },
        // {
        //     name: "maimai MURASAKi PLUS (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai MURASAKi PLUS（日服）",
        //         "zh-TW": "maimai MURASAKi PLUS（日本）",
        //     },
        //     value: "jp-murasakiplus",
        // },
        // {
        //     name: "maimai MURASAKi (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai MURASAKi（日服）",
        //         "zh-TW": "maimai MURASAKi（日本）",
        //     },
        //     value: "jp-murasaki",
        // },
        // {
        //     name: "maimai PiNK PLUS (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai PiNK PLUS（日服）",
        //         "zh-TW": "maimai PiNK PLUS（日本）",
        //     },
        //     value: "jp-pinkplus",
        // },
        // {
        //     name: "maimai PiNK (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai PiNK（日服）",
        //         "zh-TW": "maimai PiNK（日本）",
        //     },
        //     value: "jp-pink",
        // },
        // {
        //     name: "maimai ORANGE PLUS (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai ORANGE PLUS（日服）",
        //         "zh-TW": "maimai ORANGE PLUS（日本）",
        //     },
        //     value: "jp-orangeplus",
        // },
        // {
        //     name: "maimai ORANGE (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai ORANGE（日服）",
        //         "zh-TW": "maimai ORANGE（日本）",
        //     },
        //     value: "jp-orange",
        // },
        // {
        //     name: "maimai GreeN PLUS (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai GreeN PLUS（日服）",
        //         "zh-TW": "maimai GreeN PLUS（日本）",
        //     },
        //     value: "jp-greenplus",
        // },
        // {
        //     name: "maimai GreeN (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai GreeN（日服）",
        //         "zh-TW": "maimai GreeN（日本）",
        //     },
        //     value: "jp-green",
        // },
        // {
        //     name: "maimai PLUS (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai PLUS（日服）",
        //         "zh-TW": "maimai PLUS（日本）",
        //     },
        //     value: "jp-maimaiplus",
        // },
        // {
        //     name: "maimai (Japan)",
        //     nameLocalizations: {
        //         "zh-CN": "maimai（日服）",
        //         "zh-TW": "maimai（日本）",
        //     },
        //     value: "jp-maimai",
        // },
    ];

    static getCommand() {
        return [
            {
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: "b50",
                description: "Generate a nice little chart of your best 50 scores!",
                descriptionLocalizations: {
                    "zh-CN": "生成 b50 图片！",
                    "zh-TW": "生成 Best 50 圖像！",
                },
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "gcm-net",
                        description: "Get best 50 scores from maimaiでらっくすNET.",
                        descriptionLocalizations: {
                            "zh-CN": "从 maimaiでらっくすNET 获取 b50 信息。",
                            "zh-TW": "從 maimaiでらっくすNET 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: ApplicationCommandOptionType.User,
                                name: "dox",
                                nameLocalizations: {
                                    "zh-CN": "看看你的",
                                    "zh-TW": "看看你的",
                                },
                                description: "Get the b50 chart of the selected user.",
                                descriptionLocalizations: {
                                    "zh-CN": "看看 ta 的 b50。",
                                    "zh-TW": "看看他的 Best 50 圖像。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "theme",
                                nameLocalizations: {
                                    "zh-CN": "主题",
                                    "zh-TW": "主題",
                                },
                                description: "Choose from a variety of themes for your Best 50 chart.",
                                descriptionLocalizations: {
                                    "zh-CN": "选择 b50 图片的主题。",
                                    "zh-TW": "選擇 Best 50 圖像的主題。",
                                },
                                autocomplete: true,
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "gcm-net-intl",
                        description: "Get best 50 scores from maimai DX NET.",
                        descriptionLocalizations: {
                            "zh-CN": "从 maimai DX NET 获取 b50 信息。",
                            "zh-TW": "從 maimai DX NET 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: ApplicationCommandOptionType.User,
                                name: "dox",
                                nameLocalizations: {
                                    "zh-CN": "看看你的",
                                    "zh-TW": "看看你的",
                                },
                                description: "Get the b50 chart of the selected user.",
                                descriptionLocalizations: {
                                    "zh-CN": "看看 ta 的 b50。",
                                    "zh-TW": "看看他的 Best 50 圖像。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "theme",
                                nameLocalizations: {
                                    "zh-CN": "主题",
                                    "zh-TW": "主題",
                                },
                                description: "Choose from a variety of themes for your Best 50 chart.",
                                descriptionLocalizations: {
                                    "zh-CN": "选择 b50 图片的主题。",
                                    "zh-TW": "選擇 Best 50 圖像的主題。",
                                },
                                autocomplete: true,
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "kamai",
                        description: "Get best 50 scores from Kamaitachi.",
                        descriptionLocalizations: {
                            "zh-CN": "从 Kamaitachi 获取 b50 信息。",
                            "zh-TW": "從 Kamaitachi 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "user",
                                nameLocalizations: {
                                    "zh-CN": "用户",
                                    "zh-TW": "使用者",
                                },
                                description: "Enter your username or check your user ID at https://kamai.tachi.ac/u/me.",
                                descriptionLocalizations: {
                                    "zh-CN": "输入用户名或在 https://kamai.tachi.ac/u/me 检查你的用户 ID。",
                                    "zh-TW": "輸入使用者名稱或在 https://kamai.tachi.ac/u/me 檢視您的使用者 ID。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.User,
                                name: "dox",
                                nameLocalizations: {
                                    "zh-CN": "看看你的",
                                    "zh-TW": "看看你的",
                                },
                                description: "Get the b50 chart of the selected user.",
                                descriptionLocalizations: {
                                    "zh-CN": "看看 ta 的 b50。",
                                    "zh-TW": "看看他的 Best 50 圖像。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "theme",
                                nameLocalizations: {
                                    "zh-CN": "主题",
                                    "zh-TW": "主題",
                                },
                                description: "Choose from a variety of themes for your Best 50 chart.",
                                descriptionLocalizations: {
                                    "zh-CN": "选择 b50 图片的主题。",
                                    "zh-TW": "選擇 Best 50 圖像的主題。",
                                },
                                autocomplete: true,
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "version",
                                nameLocalizations: {
                                    "zh-CN": "版本",
                                    "zh-TW": "版本",
                                },
                                description: "Select the target version for New Version scores.",
                                descriptionLocalizations: {
                                    "zh-CN": "选择 b15 的版本。",
                                    "zh-TW": "選擇 New Version 分數的版本。",
                                },
                                autocomplete: true,
                            },
                            {
                                type: ApplicationCommandOptionType.Boolean,
                                name: "use_profile_picture",
                                nameLocalizations: {
                                    "zh-CN": "使用头像",
                                    "zh-TW": "使用個人資料圖像",
                                },
                                description: "Use your profile picture from Kamaitachi.",
                                descriptionLocalizations: {
                                    "zh-CN": "使用你在 Kamaitachi 上的头像。",
                                    "zh-TW": "使用您在 Kamaitachi 上的個人資料圖像。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.Boolean,
                                name: "show_recent_upscore",
                                nameLocalizations: {
                                    "zh-CN": "显示最近上分",
                                    "zh-TW": "顯示最近上分",
                                },
                                description: "Show an indicator of recently upscored charts.",
                                descriptionLocalizations: {
                                    "zh-CN": "在最近上分的谱面上显示指示器。",
                                    "zh-TW": "在最近上分的譜面上顯示指示器。",
                                },
                            },
                        ],
                    },
                    ...(() => {
                        return kasumi.config.getSync("maimai::lxns.token")
                            ? [
                                  {
                                      type: ApplicationCommandOptionType.Subcommand,
                                      name: "lxns",
                                      description: "Get best 50 scores from LXNS.",
                                      descriptionLocalizations: {
                                          "zh-CN": "从 落雪查分器 获取 b50 信息。",
                                          "zh-TW": "從 LXNS 獲取 Best 50 資料。",
                                      },
                                      options: [
                                          {
                                              type: ApplicationCommandOptionType.String,
                                              name: "friendcode",
                                              nameLocalizations: {
                                                  "zh-CN": "好友码",
                                                  "zh-TW": "好友代號",
                                              },
                                              description: "You can see your friend code at https://maimai.lxns.net/user/profile.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "你可以在 https://maimai.lxns.net/user/profile 看到你的好友码。",
                                                  "zh-TW": "您可以在 https://maimai.lxns.net/user/profile 檢視您的好友代號。",
                                              },
                                          },
                                          {
                                              type: ApplicationCommandOptionType.User,
                                              name: "dox",
                                              nameLocalizations: {
                                                  "zh-CN": "看看你的",
                                                  "zh-TW": "看看你的",
                                              },
                                              description: "Get the b50 chart of the selected user.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "看看 ta 的 b50。",
                                                  "zh-TW": "看看他的 Best 50 圖像。",
                                              },
                                          },
                                          {
                                              type: ApplicationCommandOptionType.String,
                                              name: "theme",
                                              nameLocalizations: {
                                                  "zh-CN": "主题",
                                                  "zh-TW": "主題",
                                              },
                                              description: "Choose from a variety of themes for your Best 50 chart.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "选择 b50 图片的主题。",
                                                  "zh-TW": "選擇 Best 50 圖像的主題。",
                                              },
                                              autocomplete: true,
                                          },
                                          {
                                              type: ApplicationCommandOptionType.Boolean,
                                              name: "use_profile_picture",
                                              nameLocalizations: {
                                                  "zh-CN": "使用头像",
                                                  "zh-TW": "使用個人資料圖像",
                                              },
                                              description: "Use your profile picture from LXNS.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "使用你在 落雪查分器 上的头像。",
                                                  "zh-TW": "使用您在 LXNS 上的個人資料圖像。",
                                              },
                                          },
                                      ],
                                  },
                              ]
                            : [];
                    })(),
                    ...(() => {
                        return kasumi.config.getSync("maimai::divingFish.token")
                            ? [
                                  {
                                      type: ApplicationCommandOptionType.Subcommand,
                                      name: "divingfish",
                                      description: "Get best 50 scores from DivingFish.",
                                      descriptionLocalizations: {
                                          "zh-CN": "从 水鱼查分器 获取 b50 信息。",
                                          "zh-TW": "從 DivingFish 獲取 Best 50 資料。",
                                      },
                                      options: [
                                          {
                                              type: ApplicationCommandOptionType.String,
                                              name: "username",
                                              nameLocalizations: {
                                                  "zh-CN": "用户名",
                                                  "zh-TW": "使用者名稱",
                                              },
                                              description: "Use the username you use to log in DivingFish.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "使用你用来登录水鱼查分器的用户名。",
                                                  "zh-TW": "使用您用來登入 DivingFish 的使用者名稱。",
                                              },
                                          },
                                          {
                                              type: ApplicationCommandOptionType.User,
                                              name: "dox",
                                              nameLocalizations: {
                                                  "zh-CN": "看看你的",
                                                  "zh-TW": "看看你的",
                                              },
                                              description: "Get the b50 chart of the selected user.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "看看 ta 的 b50。",
                                                  "zh-TW": "看看他的 Best 50 圖像。",
                                              },
                                          },
                                          {
                                              type: ApplicationCommandOptionType.String,
                                              name: "theme",
                                              nameLocalizations: {
                                                  "zh-CN": "主题",
                                                  "zh-TW": "主題",
                                              },
                                              description: "Choose from a variety of themes for your Best 50 chart.",
                                              descriptionLocalizations: {
                                                  "zh-CN": "选择 b50 图片的主题。",
                                                  "zh-TW": "選擇 Best 50 圖像的主題。",
                                              },
                                              autocomplete: true,
                                          },
                                      ],
                                  },
                              ]
                            : [];
                    })(),
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "maishift",
                        description: "Get best 50 scores from Maishift.",
                        descriptionLocalizations: {
                            "zh-CN": "从 Maishift 获取 b50 信息。",
                            "zh-TW": "從 Maishift 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "username",
                                nameLocalizations: {
                                    "zh-CN": "用户名",
                                    "zh-TW": "使用者名稱",
                                },
                                description: "Enter your username on Maishift.",
                                descriptionLocalizations: {
                                    "zh-CN": "输入您在 Maishift 上的用户名。",
                                    "zh-TW": "輸入您在 Maishift 上的使用者名稱。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.User,
                                name: "dox",
                                nameLocalizations: {
                                    "zh-CN": "看看你的",
                                    "zh-TW": "看看你的",
                                },
                                description: "Get the b50 chart of the selected user.",
                                descriptionLocalizations: {
                                    "zh-CN": "看看 ta 的 b50。",
                                    "zh-TW": "看看他的 Best 50 圖像。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "theme",
                                nameLocalizations: {
                                    "zh-CN": "主题",
                                    "zh-TW": "主題",
                                },
                                description: "Choose from a variety of themes for your Best 50 chart.",
                                descriptionLocalizations: {
                                    "zh-CN": "选择 b50 图片的主题。",
                                    "zh-TW": "選擇 Best 50 圖像的主題。",
                                },
                                autocomplete: true,
                            },
                            {
                                type: ApplicationCommandOptionType.Boolean,
                                name: "use_profile_picture",
                                nameLocalizations: {
                                    "zh-CN": "使用头像",
                                    "zh-TW": "使用個人資料圖像",
                                },
                                description: "Use your profile picture from Maishift.",
                                descriptionLocalizations: {
                                    "zh-CN": "使用你在 Maishift 上的头像。",
                                    "zh-TW": "使用您在 Maishift 上的個人資料圖像。",
                                },
                            },
                        ],
                    },
                ],
            },
        ];
    }
}
