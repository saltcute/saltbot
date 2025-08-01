import {
    ApplicationCommandOptionType,
    AttachmentBuilder,
    ButtonStyle,
    ComponentType,
    Events,
    Interaction,
    MessageFlags,
} from "discord.js";
import { MaiDraw } from "maidraw";
import { client as kasumi } from "@/kook/init/client";
import { Telemetry } from "@/util/telemetry";
import { EResultTypes } from "@/util/telemetry/type";
import { Util } from "@/util";

const lxns = new MaiDraw.Maimai.Best50.LXNS({
    auth: kasumi.config.getSync("maimai::lxns.token"),
});
const kamai = new MaiDraw.Maimai.Best50.KamaiTachi();
const maishift = new MaiDraw.Maimai.Best50.Maishift();
const divingfish = new MaiDraw.Maimai.Best50.DivingFish({
    auth: kasumi.config.getSync("maimai::divingFish.token"),
});

export class Level50ChartCommand {
    private static readonly AVAILABLE_VERSION_THEME = [
        "jp-finale",
        "jp-buddies",
        "jp-buddiesplus",
        "jp-prism",
        "jp-prismplus",
    ];
    private static readonly DEFAULT_VERSION = "jp-prism";
    private static readonly DEFAULT_THEME = "jp-prism-portrait";
    private static readonly DEFAULT_USE_TRACKER_PROFILE_PICTURE = true;

    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(
        async (interaction) => {
            if (!interaction.isChatInputCommand()) return EResultTypes.IGNORED;
            if (interaction.commandName != "mai") return EResultTypes.IGNORED;
            if (interaction.options.getSubcommandGroup() != "level50")
                return EResultTypes.IGNORED;

            let result: Buffer | null = null,
                useBrainrot = false;
            const version =
                interaction.options.getString("version", false) ||
                this.DEFAULT_VERSION;
            const theme =
                interaction.options.getString("theme", false) ||
                (version && this.AVAILABLE_VERSION_THEME.includes(version)
                    ? `${version}-portrait`
                    : this.DEFAULT_THEME);
            const level = interaction.options.getNumber("level", true);
            if (level < 1 || level > 15) {
                await interaction.reply({
                    content:
                        "Invalid level. Please try again with a level between 1 and 15.",
                    flags: [MessageFlags.Ephemeral],
                });
            }
            const page = interaction.options.getInteger("page", false) || 1;
            const pfpOption = interaction.options.getBoolean(
                "use_profile_picture",
                false
            );
            const useProfilePicture =
                pfpOption == null
                    ? this.DEFAULT_USE_TRACKER_PROFILE_PICTURE
                    : pfpOption;
            const tracker = interaction.options.getSubcommand();
            if (
                !(
                    tracker == "kamai" ||
                    tracker == "divingfish" ||
                    tracker == "lxns" ||
                    tracker == "maishift"
                )
            ) {
                await interaction.editReply({
                    content: "Invalid tracker. Please try again.",
                });
                return EResultTypes.INVALID_TRACKER;
            }
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
            if (username == null) {
                const dbUsername = await kasumi.config.getOne(
                    `salt::connection.discord.${tracker}.${interaction.user.id}`
                );
                if (!dbUsername) {
                    await interaction.reply({
                        content: `Please provide your ${tracker == "lxns" ? "friend code" : "username"}. To use without a ${tracker == "lxns" ? "friend code" : "username"}, you need to select "remember my username" after generating a chart or use \`/mai link\` to link your account.`,
                        ephemeral: true,
                    });
                    return EResultTypes.INVALID_USERNAME;
                } else {
                    username = dbUsername;
                }
            }
            await interaction.deferReply();
            switch (tracker) {
                case "kamai": {
                    let kamaiInstance;
                    switch (version) {
                        case "jp-maimai":
                            kamaiInstance = kamai.maimai();
                            break;
                        case "jp-maimaiplus":
                            kamaiInstance = kamai.maimaiPlus();
                            break;
                        case "jp-green":
                            kamaiInstance = kamai.green();
                            break;
                        case "jp-greenplus":
                            kamaiInstance = kamai.greenPlus();
                            break;
                        case "jp-orange":
                            kamaiInstance = kamai.orange();
                            break;
                        case "jp-orangeplus":
                            kamaiInstance = kamai.orangePlus();
                            break;
                        case "jp-pink":
                            kamaiInstance = kamai.pink();
                            break;
                        case "jp-pinkplus":
                            kamaiInstance = kamai.pinkPlus();
                            break;
                        case "jp-murasaki":
                            kamaiInstance = kamai.murasaki();
                            break;
                        case "jp-murasakiplus":
                            kamaiInstance = kamai.murasakiPlus();
                            break;
                        case "jp-milk":
                            kamaiInstance = kamai.milk();
                            break;
                        case "jp-milkplus":
                            kamaiInstance = kamai.milkPlus();
                            break;
                        case "jp-finale":
                            kamaiInstance = kamai.finale();
                            break;
                        case "jp-dx":
                            kamaiInstance = kamai.dx();
                            break;
                        case "jp-dxplus":
                            kamaiInstance = kamai.dxPlus();
                            break;
                        case "jp-splash":
                            kamaiInstance = kamai.splash();
                            break;
                        case "jp-splashplus":
                            kamaiInstance = kamai.splashPlus();
                            break;
                        case "jp-universe":
                            kamaiInstance = kamai.universe();
                            break;
                        case "jp-universeplus":
                            kamaiInstance = kamai.universePlus();
                            break;
                        case "jp-festival":
                            kamaiInstance = kamai.festival();
                            break;
                        case "jp-festivalplus":
                            kamaiInstance = kamai.festivalPlus();
                            break;
                        case "jp-buddies":
                            kamaiInstance = kamai.buddies();
                            break;
                        case "jp-buddiesplus":
                            kamaiInstance = kamai.buddiesPlus();
                            break;
                        case "jp-prism":
                            kamaiInstance = kamai.prism();
                            break;
                        case "jp-prismplus":
                            kamaiInstance = kamai.prismPlus();
                            break;
                        default:
                            kamaiInstance = kamai;
                            break;
                    }
                    const score = await kamaiInstance.getPlayerLevel50(
                        username,
                        level,
                        page
                    );
                    if (
                        score &&
                        score.findIndex((v) => v.chart.name == "Baqeela") != -1
                    ) {
                        useBrainrot = true;
                    }
                    result = await MaiDraw.Maimai.Level50.drawWithScoreSource(
                        kamaiInstance,
                        username,
                        level,
                        page,
                        { theme }
                    );
                    break;
                }
                case "divingfish": {
                    result = await MaiDraw.Maimai.Level50.drawWithScoreSource(
                        divingfish,
                        username,
                        level,
                        page,
                        { theme }
                    );
                    break;
                }
                case "lxns": {
                    result = await MaiDraw.Maimai.Level50.drawWithScoreSource(
                        lxns,
                        username,
                        level,
                        page,
                        {
                            theme,
                            profilePicture: useProfilePicture
                                ? undefined
                                : null,
                        }
                    );
                    break;
                }
                case "maishift": {
                    result = await MaiDraw.Maimai.Level50.drawWithScoreSource(
                        maishift,
                        username,
                        level,
                        page,
                        {
                            theme,
                            profilePicture: useProfilePicture
                                ? undefined
                                : null,
                        }
                    );
                    break;
                }
            }
            if (!result) {
                await interaction.editReply({
                    content:
                        "Failed to generate a chart. Please check your input.",
                });
                return EResultTypes.TRACKER_BAD_RESPONSE;
            } else {
                await interaction.editReply({
                    content: `Showing results ${(page - 1) * 50 + 1} to ${page * 50}`,
                    files: [
                        new AttachmentBuilder(result, {
                            name: "result.png",
                        }),
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    label: "Previous Page",
                                    style: ButtonStyle.Primary,
                                    custom_id: `maimai::level50.page.${tracker},${username},${theme},${level},${page <= 1 ? 1 : page - 1}`,
                                    disabled: page <= 1,
                                },
                                {
                                    type: ComponentType.Button,
                                    label: "Next Page",
                                    style: ButtonStyle.Primary,
                                    custom_id: `maimai::level50.page.${tracker},${username},${theme},${level},${page + 1}`,
                                },
                            ],
                        },
                    ],
                });
                const link = await kasumi.config.getOne(
                    `salt::connection.discord.${tracker}.${interaction.user.id}`
                );
                const ignore = await kasumi.config.getOne(
                    `salt::connection.discord.ignore.${tracker}.${interaction.user.id}`
                );
                if (!link && !ignore) {
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
                                        custom_id: `maimai::tracker.link.${tracker}.${interaction.user.id}.${username}`,
                                    },
                                    {
                                        type: 2,
                                        label: "Later",
                                        style: 3,
                                        custom_id: `maimai::tracker.link.nocomment`,
                                    },
                                    {
                                        type: 2,
                                        label: "GO MIND YOUR OWN BUSINESS",
                                        style: 4,
                                        custom_id: `maimai::tracker.link.ignore.${tracker}.${interaction.user.id}`,
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
                        return EResultTypes.GENERATE_BAQEELA_SUCCESS;
                    }
                }
                return EResultTypes.GENERATE_SUCCESS;
            }
        }
    );
    static readonly BUTTON_HANDLER = Telemetry.discordMiddleware(
        async (interaction: Interaction) => {
            if (!interaction.isButton()) return EResultTypes.IGNORED;
            if (interaction.customId.startsWith("maimai::level50.page.")) {
                const [tracker, username, theme, levelRaw, pageRaw] =
                    interaction.customId
                        .replace("maimai::level50.page.", "")
                        .split(",");
                const level = parseFloat(levelRaw),
                    page = parseInt(pageRaw);
                if (
                    tracker == "kamai" &&
                    username &&
                    theme &&
                    level &&
                    page >= 1
                ) {
                    if (
                        interaction.message.interactionMetadata?.user.id !=
                        interaction.user.id
                    ) {
                        await interaction.reply({
                            content:
                                "You can't change the page of someone else's chart.",
                            flags: [MessageFlags.Ephemeral],
                        });
                        return EResultTypes.IGNORED;
                    }
                    let result;
                    switch (tracker) {
                        case "kamai":
                            result =
                                await MaiDraw.Maimai.Level50.drawWithScoreSource(
                                    kamai,
                                    username,
                                    level,
                                    page,
                                    { theme }
                                );
                            break;
                    }
                    if (result) {
                        await interaction
                            .update({
                                content: `Showing results ${(page - 1) * 50 + 1} to ${page * 50}`,
                                files: [
                                    new AttachmentBuilder(result, {
                                        name: "result.png",
                                    }),
                                ],
                                components: [
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: ComponentType.Button,
                                                label: "Previous Page",
                                                style: ButtonStyle.Primary,
                                                custom_id: `maimai::level50.page.${tracker},${username},${theme},${level},${page <= 1 ? 1 : page - 1}`,
                                                disabled: page <= 1,
                                            },
                                            {
                                                type: ComponentType.Button,
                                                label: "Next Page",
                                                style: ButtonStyle.Primary,
                                                custom_id: `maimai::level50.page.${tracker},${username},${theme},${level},${page + 1}`,
                                            },
                                        ],
                                    },
                                ],
                            })
                            .catch(() => {});
                    }
                }
            }
            return EResultTypes.IGNORED;
        }
    );

    static readonly themes = [
        // {
        //     name: "maimai でらっくす PRiSM PLUS (Japan), landscape",
        //     name_localizations: {
        //         "zh-CN": "maimai でらっくす PRiSM PLUS（日服），横向",
        //         "zh-TW": "maimai でらっくす PRiSM（日本），橫向",
        //     },
        //     value: "jp-prismplus-landscape",
        // },
        {
            name: "maimai でらっくす PRiSM PLUS (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす PRiSM PLUS（日本），縱向",
            },
            value: "jp-prismplus-portrait",
        },
        // {
        //     name: "maimai でらっくす PRiSM (Japan), landscape",
        //     name_localizations: {
        //         "zh-CN": "maimai でらっくす PRiSM（日服），横向",
        //         "zh-TW": "maimai でらっくす PRiSM（日本），橫向",
        //     },
        //     value: "jp-prism-landscape",
        // },
        {
            name: "maimai でらっくす PRiSM (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服），纵向",
                "zh-TW": "maimai でらっくす PRiSM（日本），縱向",
            },
            value: "jp-prism-portrait",
        },
        // {
        //     name: "maimai でらっくす BUDDiES PLUS (Japan), landscape",
        //     name_localizations: {
        //         "zh-CN": "maimai でらっくす BUDDiES PLUS（日服），横向",
        //         "zh-TW": "maimai でらっくす BUDDiES PLUS（日本），橫向",
        //     },
        //     value: "jp-buddiesplus-landscape",
        // },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本），縱向",
            },
            value: "jp-buddiesplus-portrait",
        },
        // {
        //     name: "maimai でらっくす BUDDiES (Japan), landscape",
        //     name_localizations: {
        //         "zh-CN": "maimai でらっくす BUDDiES（日服），横向",
        //         "zh-TW": "maimai でらっくす BUDDiES（日本），橫向",
        //     },
        //     value: "jp-buddies-landscape",
        // },
        {
            name: "maimai でらっくす BUDDiES (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES（日服），纵向",
                "zh-TW": "maimai でらっくす BUDDiES（日本），縱向",
            },
            value: "jp-buddies-portrait",
        },
        // {
        //     name: "maimai FiNALE (Japan), landscape",
        //     name_localizations: {
        //         "zh-CN": "maimai FiNALE（日服），横向",
        //         "zh-TW": "maimai FiNALE（日本），橫向",
        //     },
        //     value: "jp-finale-landscape",
        // },
        {
            name: "maimai FiNALE (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai FiNALE（日服），纵向",
                "zh-TW": "maimai FiNALE（日本），縱向",
            },
            value: "jp-finale-portrait",
        },
        // {
        //     name: "舞萌DX 2024 (China), landscape",
        //     name_localizations: {
        //         "zh-CN": "舞萌DX 2024（国服），横向",
        //         "zh-TW": "舞萌DX 2024（中國），橫向",
        //     },
        //     value: "cn-2024-landscape",
        // },
        {
            name: "舞萌DX 2024 (China), portrait",
            name_localizations: {
                "zh-CN": "舞萌DX 2024（国服），纵向",
                "zh-TW": "舞萌DX 2024（中國），縱向",
            },
            value: "cn-2024-portrait",
        },
    ];

    static readonly versions = [
        {
            name: "maimai でらっくす PRiSM PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服）",
                "zh-TW": "maimai でらっくす PRiSM PLUS（日本）",
            },
            value: "jp-prismplus",
        },
        {
            name: "maimai でらっくす PRiSM (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服）",
                "zh-TW": "maimai でらっくす PRiSM（日本）",
            },
            value: "jp-prism",
        },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服）",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本）",
            },
            value: "jp-buddiesplus",
        },
        {
            name: "maimai でらっくす BUDDiES (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES （日服）",
                "zh-TW": "maimai でらっくす BUDDiES （日本）",
            },
            value: "jp-buddies",
        },
        {
            name: "maimai でらっくす FESTiVAL PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす FESTiVAL PLUS（日服）",
                "zh-TW": "maimai でらっくす FESTiVAL PLUS（日本）",
            },
            value: "jp-festivalplus",
        },
        {
            name: "maimai でらっくす FESTiVAL (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす FESTiVAL （日服）",
                "zh-TW": "maimai でらっくす FESTiVAL （日本）",
            },
            value: "jp-festival",
        },
        {
            name: "maimai でらっくす UNiVERSE PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす UNiVERSE PLUS（日服）",
                "zh-TW": "maimai でらっくす UNiVERSE PLUS（日本）",
            },
            value: "jp-universeplus",
        },
        {
            name: "maimai でらっくす UNiVERSE (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす UNiVERSE （日服）",
                "zh-TW": "maimai でらっくす UNiVERSE （日本）",
            },
            value: "jp-universe",
        },
        {
            name: "maimai でらっくす Splash PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす Splash PLUS（日服）",
                "zh-TW": "maimai でらっくす Splash PLUS（日本）",
            },
            value: "jp-splashplus",
        },
        {
            name: "maimai でらっくす Splash (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす Splash （日服）",
                "zh-TW": "maimai でらっくす Splash （日本）",
            },
            value: "jp-splash",
        },
        {
            name: "maimai でらっくす PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす PLUS（日服）",
                "zh-TW": "maimai でらっくす PLUS（日本）",
            },
            value: "jp-dxplus",
        },
        {
            name: "maimai でらっくす (Japan)",
            name_localizations: {
                "zh-CN": "maimai でらっくす（日服）",
                "zh-TW": "maimai でらっくす（日本）",
            },
            value: "jp-dx",
        },
        {
            name: "maimai FiNALE (Japan)",
            name_localizations: {
                "zh-CN": "maimai FiNALE（日服）",
                "zh-TW": "maimai FiNALE（日本）",
            },
            value: "jp-finale",
        },
        {
            name: "maimai MiLK PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai MiLK PLUS（日服）",
                "zh-TW": "maimai MiLK PLUS（日本）",
            },
            value: "jp-milkplus",
        },
        {
            name: "maimai MiLK (Japan)",
            name_localizations: {
                "zh-CN": "maimai MiLK（日服）",
                "zh-TW": "maimai MiLK（日本）",
            },
            value: "jp-milk",
        },
        {
            name: "maimai MURASAKi PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai MURASAKi PLUS（日服）",
                "zh-TW": "maimai MURASAKi PLUS（日本）",
            },
            value: "jp-murasakiplus",
        },
        {
            name: "maimai MURASAKi (Japan)",
            name_localizations: {
                "zh-CN": "maimai MURASAKi（日服）",
                "zh-TW": "maimai MURASAKi（日本）",
            },
            value: "jp-murasaki",
        },
        {
            name: "maimai PiNK PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai PiNK PLUS（日服）",
                "zh-TW": "maimai PiNK PLUS（日本）",
            },
            value: "jp-pinkplus",
        },
        {
            name: "maimai PiNK (Japan)",
            name_localizations: {
                "zh-CN": "maimai PiNK（日服）",
                "zh-TW": "maimai PiNK（日本）",
            },
            value: "jp-pink",
        },
        {
            name: "maimai ORANGE PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai ORANGE PLUS（日服）",
                "zh-TW": "maimai ORANGE PLUS（日本）",
            },
            value: "jp-orangeplus",
        },
        {
            name: "maimai ORANGE (Japan)",
            name_localizations: {
                "zh-CN": "maimai ORANGE（日服）",
                "zh-TW": "maimai ORANGE（日本）",
            },
            value: "jp-orange",
        },
        {
            name: "maimai GreeN PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai GreeN PLUS（日服）",
                "zh-TW": "maimai GreeN PLUS（日本）",
            },
            value: "jp-greenplus",
        },
        {
            name: "maimai GreeN (Japan)",
            name_localizations: {
                "zh-CN": "maimai GreeN（日服）",
                "zh-TW": "maimai GreeN（日本）",
            },
            value: "jp-green",
        },
        {
            name: "maimai PLUS (Japan)",
            name_localizations: {
                "zh-CN": "maimai PLUS（日服）",
                "zh-TW": "maimai PLUS（日本）",
            },
            value: "jp-maimaiplus",
        },
        {
            name: "maimai (Japan)",
            name_localizations: {
                "zh-CN": "maimai（日服）",
                "zh-TW": "maimai（日本）",
            },
            value: "jp-maimai",
        },
    ];

    static readonly levels = [
        {
            name: "15",
            value: 15,
        },
        {
            name: "14+",
            value: 14.7,
        },
        {
            name: "14",
            value: 14,
        },
        {
            name: "13+",
            value: 13.7,
        },
        {
            name: "13",
            value: 13,
        },
        {
            name: "12+",
            value: 12.7,
        },
        {
            name: "12",
            value: 12,
        },
        {
            name: "11+",
            value: 11.7,
        },
        {
            name: "11",
            value: 11,
        },
        {
            name: "10+",
            value: 10.7,
        },
        {
            name: "10",
            value: 10,
        },
        {
            name: "9+",
            value: 9.7,
        },
        {
            name: "9",
            value: 9,
        },
        {
            name: "8+",
            value: 8.7,
        },
        {
            name: "8",
            value: 8,
        },
        {
            name: "7+",
            value: 7.7,
        },
        {
            name: "7",
            value: 7,
        },
        {
            name: "6",
            value: 6,
        },
        {
            name: "5",
            value: 5,
        },
        {
            name: "4",
            value: 4,
        },
        {
            name: "3",
            value: 3,
        },
        {
            name: "2",
            value: 2,
        },
        {
            name: "1",
            value: 1,
        },
    ];

    static getCommand() {
        return [
            {
                type: 2,
                name: "level50",
                description:
                    "Generate a chart of your best scores in a specific level.",
                description_localizations: {
                    "zh-CN": "生成等级牌子图片。",
                    "zh-TW": "生成等級最高分圖像。",
                },
                options: [
                    {
                        type: 1,
                        name: "kamai",
                        description: "Get Level 50 scores from Kamaitachi.",
                        description_localizations: {
                            "zh-CN": "从 Kamaitachi 获取 L50 信息。",
                            "zh-TW": "從 Kamaitachi 獲取 Level 50 資料。",
                        },
                        options: [
                            {
                                type: ApplicationCommandOptionType.Number,
                                name: "level",
                                name_localizations: {
                                    "zh-CN": "难度",
                                    "zh-TW": "難度",
                                },
                                description:
                                    "The target level for the Level 50 chart.",
                                description_localizations: {
                                    "zh-CN": "选择生成 L50 图片的目标难度。",
                                    "zh-TW":
                                        "選擇生成 Level 50 圖像的目標難度。",
                                },
                                required: true,
                                choices: this.levels,
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "user",
                                name_localizations: {
                                    "zh-CN": "用户",
                                    "zh-TW": "使用者",
                                },
                                description:
                                    "Enter your username or check your user ID at https://kamai.tachi.ac/u/me.",
                                description_localizations: {
                                    "zh-CN":
                                        "输入用户名或在 https://kamai.tachi.ac/u/me 检查你的用户 ID。",
                                    "zh-TW":
                                        "輸入使用者名稱或在 https://kamai.tachi.ac/u/me 檢視您的使用者 ID。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.Integer,
                                name: "page",
                                name_localizations: {
                                    "zh-CN": "分页",
                                    "zh-TW": "分頁",
                                },
                                description:
                                    "The page number for the Level 50 chart. (50 scores per page)",
                                description_localizations: {
                                    "zh-CN":
                                        "选择生成 L50 图片的页码。（每页 50 个）",
                                    "zh-TW":
                                        "選擇生成 Level 50 圖像的頁碼。（每頁 50 個）",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "theme",
                                name_localizations: {
                                    "zh-CN": "主题",
                                    "zh-TW": "主題",
                                },
                                description:
                                    "Choose from a variety of themes for your Level 50 chart.",
                                description_localizations: {
                                    "zh-CN": "选择 L50 图片的主题。",
                                    "zh-TW": "選擇 Level 50 圖像的主題。",
                                },
                                choices: this.themes,
                            },
                            // {
                            //     type: 3,
                            //     name: "version",
                            //     name_localizations: {
                            //         "zh-CN": "版本",
                            //         "zh-TW": "版本",
                            //     },
                            //     description:
                            //         "Select the target version for New Version scores.",
                            //     description_localizations: {
                            //         "zh-CN": "选择 b15 的版本。",
                            //         "zh-TW": "選擇 New Version 分數的版本。",
                            //     },
                            //     choices: this.versions,
                            // },
                            {
                                type: ApplicationCommandOptionType.Boolean,
                                name: "use_profile_picture",
                                name_localizations: {
                                    "zh-CN": "使用头像",
                                    "zh-TW": "使用個人資料圖像",
                                },
                                description:
                                    "Use your profile picture from Kamaitachi.",
                                description_localizations: {
                                    "zh-CN": "使用你在 Kamaitachi 上的头像。",
                                    "zh-TW":
                                        "使用您在 Kamaitachi 上的個人資料圖像。",
                                },
                                choices: this.versions,
                            },
                        ],
                    },
                    // ...(() => {
                    //     return kasumi.config.getSync("maimai::lxns.token")
                    //         ? [
                    //               {
                    //                   type: 1,
                    //                   name: "lxns",
                    //                   description:
                    //                       "Get best 50 scores from LXNS.",
                    //                   description_localizations: {
                    //                       "zh-CN":
                    //                           "从 落雪查分器 获取 b50 信息。",
                    //                       "zh-TW":
                    //                           "從 LXNS 獲取 Best 50 資料。",
                    //                   },
                    //                   options: [
                    //                       {
                    //                           type: 3,
                    //                           name: "friendcode",
                    //                           name_localizations: {
                    //                               "zh-CN": "好友码",
                    //                               "zh-TW": "好友代號",
                    //                           },
                    //                           description:
                    //                               "You can see your friend code at https://maimai.lxns.net/user/profile.",
                    //                           description_localizations: {
                    //                               "zh-CN":
                    //                                   "你可以在 https://maimai.lxns.net/user/profile 看到你的好友码。",
                    //                               "zh-TW":
                    //                                   "您可以在 https://maimai.lxns.net/user/profile 檢視您的好友代號。",
                    //                           },
                    //                       },
                    //                       {
                    //                           type: 3,
                    //                           name: "theme",
                    //                           name_localizations: {
                    //                               "zh-CN": "主题",
                    //                               "zh-TW": "主題",
                    //                           },
                    //                           description:
                    //                               "Choose from a variety of themes for your Best 50 chart.",
                    //                           description_localizations: {
                    //                               "zh-CN":
                    //                                   "选择 b50 图片的主题。",
                    //                               "zh-TW":
                    //                                   "選擇 Best 50 圖像的主題。",
                    //                           },
                    //                           choices: this.themes,
                    //                       },
                    //                       {
                    //                           type: 5,
                    //                           name: "use_profile_picture",
                    //                           name_localizations: {
                    //                               "zh-CN": "使用头像",
                    //                               "zh-TW": "使用個人資料圖像",
                    //                           },
                    //                           description:
                    //                               "Use your profile picture from LXNS.",
                    //                           description_localizations: {
                    //                               "zh-CN":
                    //                                   "使用你在 落雪查分器 上的头像。",
                    //                               "zh-TW":
                    //                                   "使用您在 LXNS 上的個人資料圖像。",
                    //                           },
                    //                           choices: this.versions,
                    //                       },
                    //                   ],
                    //               },
                    //           ]
                    //         : [];
                    // })(),
                    // ...(() => {
                    //     return kasumi.config.getSync("maimai::divingFish.token")
                    //         ? [
                    //               {
                    //                   type: 1,
                    //                   name: "divingfish",
                    //                   description:
                    //                       "Get best 50 scores from DivingFish.",
                    //                   description_localizations: {
                    //                       "zh-CN":
                    //                           "从 水鱼查分器 获取 b50 信息。",
                    //                       "zh-TW":
                    //                           "從 DivingFish 獲取 Best 50 資料。",
                    //                   },
                    //                   options: [
                    //                       {
                    //                           type: 3,
                    //                           name: "username",
                    //                           name_localizations: {
                    //                               "zh-CN": "用户名",
                    //                               "zh-TW": "使用者名稱",
                    //                           },
                    //                           description:
                    //                               "Use the username you use to log in DivingFish.",
                    //                           description_localizations: {
                    //                               "zh-CN":
                    //                                   "使用你用来登录水鱼查分器的用户名。",
                    //                               "zh-TW":
                    //                                   "使用您用來登入 DivingFish 的使用者名稱。",
                    //                           },
                    //                       },
                    //                       {
                    //                           type: 3,
                    //                           name: "theme",
                    //                           name_localizations: {
                    //                               "zh-CN": "主题",
                    //                               "zh-TW": "主題",
                    //                           },
                    //                           description:
                    //                               "Choose from a variety of themes for your Best 50 chart.",
                    //                           description_localizations: {
                    //                               "zh-CN":
                    //                                   "选择 b50 图片的主题。",
                    //                               "zh-TW":
                    //                                   "選擇 Best 50 圖像的主題。",
                    //                           },
                    //                       },
                    //                   ],
                    //               },
                    //           ]
                    //         : [];
                    // })(),
                    // {
                    //     type: 1,
                    //     name: "maishift",
                    //     description: "Get best 50 scores from Maishift.",
                    //     description_localizations: {
                    //         "zh-CN": "从 Maishift 获取 b50 信息。",
                    //         "zh-TW": "從 Maishift 獲取 Best 50 資料。",
                    //     },
                    //     options: [
                    //         {
                    //             type: 3,
                    //             name: "username",
                    //             name_localizations: {
                    //                 "zh-CN": "用户名",
                    //                 "zh-TW": "使用者名稱",
                    //             },
                    //             description: "Enter your username on Maishift.",
                    //             description_localizations: {
                    //                 "zh-CN": "输入您在 Maishift 上的用户名。",
                    //                 "zh-TW":
                    //                     "輸入您在 Maishift 上的使用者名稱。",
                    //             },
                    //         },
                    //         {
                    //             type: 3,
                    //             name: "theme",
                    //             name_localizations: {
                    //                 "zh-CN": "主题",
                    //                 "zh-TW": "主題",
                    //             },
                    //             description:
                    //                 "Choose from a variety of themes for your Best 50 chart.",
                    //             description_localizations: {
                    //                 "zh-CN": "选择 b50 图片的主题。",
                    //                 "zh-TW": "選擇 Best 50 圖像的主題。",
                    //             },
                    //             choices: this.themes,
                    //         },
                    //         {
                    //             type: 5,
                    //             name: "use_profile_picture",
                    //             name_localizations: {
                    //                 "zh-CN": "使用头像",
                    //                 "zh-TW": "使用個人資料圖像",
                    //             },
                    //             description:
                    //                 "Use your profile picture from Maishift.",
                    //             description_localizations: {
                    //                 "zh-CN": "使用你在 Maishift 上的头像。",
                    //                 "zh-TW":
                    //                     "使用您在 Maishift 上的個人資料圖像。",
                    //             },
                    //             choices: this.versions,
                    //         },
                    //     ],
                    // },
                ],
            },
        ];
    }
}
