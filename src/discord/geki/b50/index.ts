import {
    ApplicationCommandOptionType,
    AttachmentBuilder,
    Events,
} from "discord.js";
import { MaiDraw } from "maidraw";
import { client as kasumi } from "@/kook/init/client";
import { client } from "@/discord/client";
import { Telemetry } from "@/util/telemetry";
import { EResultTypes } from "@/util/telemetry/type";

const kamai = new MaiDraw.Geki.Adapters.KamaiTachi();

const painter = new MaiDraw.Geki.Painters.Best50();

export class Best50ChartCommand {
    private static readonly AVAILABLE_VERSION_THEME = [
        "jp-refresh",
        "jp-brightmemory",
    ];
    private static readonly DEFAULT_VERSION = "jp-brightmemoryact3";
    private static readonly DEFAULT_THEME = "jp-refresh-landscape";
    private static readonly DEFAULT_USE_TRACKER_PROFILE_PICTURE = true;
    private static readonly DEFAULT_RATING_ALOGRITHM = "refresh";

    private static readonly DEFAULT_VERSION_RATING_ALOGRITHM_MAP: Record<
        string,
        "refresh" | "classic"
    > = {
        "jp-refresh": "refresh",
        "jp-brightmemoryact3": "classic",
        "jp-brightmemoryact2": "classic",
        "jp-brightmemoryact1": "classic",
        "jp-bright": "classic",
        "jp-redplus": "classic",
        "jp-red": "classic",
        "jp-summerplus": "classic",
        "jp-summer": "classic",
        "jp-plus": "classic",
        "jp-ongeki": "classic",
    };
    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(
        async (interaction) => {
            if (!interaction.isChatInputCommand()) return EResultTypes.IGNORED;
            if (interaction.commandName != "geki") return EResultTypes.IGNORED;
            if (interaction.options.getSubcommandGroup() != "b50")
                return EResultTypes.IGNORED;

            let result: Buffer | null = null;
            const version =
                interaction.options.getString("version", false) ||
                this.DEFAULT_VERSION;
            const themeVersion = version.includes("act")
                ? version.replace(/act[1-3]/, "")
                : version;
            const type =
                interaction.options.getString("type", false) == "classic"
                    ? "classic"
                    : interaction.options.getString("type", false) == "refresh"
                      ? "refresh"
                      : this.DEFAULT_VERSION_RATING_ALOGRITHM_MAP[version] ||
                        this.DEFAULT_RATING_ALOGRITHM;

            const theme =
                (interaction.options.getString("theme", false) ||
                    (themeVersion &&
                    this.AVAILABLE_VERSION_THEME.includes(themeVersion)
                        ? `${themeVersion}-landscape`
                        : this.DEFAULT_THEME)) +
                "-" +
                type;

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
                    tracker == "lxns"
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
                    // username = interaction.options.getString("username");
                    break;
                }
                case "lxns": {
                    // username = interaction.options.getString("friendcode");
                    break;
                }
            }
            const mention = interaction.options.getUser("dox");
            if (username == null) {
                if (mention) {
                    const dbUsername = await kasumi.config.getOne(
                        `salt::connection.discord.${tracker}.${mention.id}`
                    );
                    if (!dbUsername) {
                        await interaction.reply({
                            content: `This user has not connected their ${tracker} ${tracker == "lxns" ? "friend code" : "username"} to their Discord account.`,
                            ephemeral: true,
                        });
                        return EResultTypes.INVALID_USERNAME;
                    } else username = dbUsername;
                } else {
                    const dbUsername = await kasumi.config.getOne(
                        `salt::connection.discord.${tracker}.${interaction.user.id}`
                    );
                    if (!dbUsername) {
                        await interaction.reply({
                            content: `Please provide your ${tracker == "lxns" ? "friend code" : "username"}. To use without a ${tracker == "lxns" ? "friend code" : "username"}, you need to select "remember my username" after generating a chart or use \`/mai link\` to link your account.`,
                            ephemeral: true,
                        });
                        return EResultTypes.INVALID_USERNAME;
                    } else username = dbUsername;
                }
            }
            await interaction.deferReply();
            switch (tracker) {
                case "kamai": {
                    let kamaiInstance;
                    switch (version) {
                        case "jp-refresh":
                            kamaiInstance = kamai.refresh();
                            break;
                        case "jp-brightmemoryact3":
                            kamaiInstance = kamai.brightMemoryAct3();
                            break;
                        case "jp-brightmemoryact2":
                            kamaiInstance = kamai.brightMemoryAct2();
                            break;
                        case "jp-brightmemoryact1":
                            kamaiInstance = kamai.brightMemoryAct1();
                            break;
                        case "jp-bright":
                            kamaiInstance = kamai.bright();
                            break;
                        case "jp-redplus":
                            kamaiInstance = kamai.redPlus();
                            break;
                        case "jp-red":
                            kamaiInstance = kamai.red();
                            break;
                        case "jp-summerplus":
                            kamaiInstance = kamai.summerPlus();
                            break;
                        case "jp-summer":
                            kamaiInstance = kamai.summer();
                            break;
                        case "jp-plus":
                            kamaiInstance = kamai.plus();
                            break;
                        case "jp-ongeki":
                            kamaiInstance = kamai.ongeki();
                            break;
                        default:
                            kamaiInstance = kamai;
                            break;
                    }
                    result = await painter.drawWithScoreSource(
                        kamaiInstance,
                        { username },
                        {
                            theme,
                            profilePicture: useProfilePicture
                                ? undefined
                                : null,
                            type,
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
                    content: "",
                    files: [
                        new AttachmentBuilder(result, {
                            name: "result.png",
                        }),
                    ],
                });
                const link = await kasumi.config.getOne(
                    `salt::connection.discord.${tracker}.${interaction.user.id}`
                );
                const ignore = await kasumi.config.getOne(
                    `salt::connection.discord.ignore.${tracker}.${interaction.user.id}`
                );
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
                return EResultTypes.GENERATE_SUCCESS;
            }
        }
    );
    static readonly types = [
        {
            name: "Best 60 (New 10 + Old 50 + Platinum 50)",
            name_localizations: { "zh-CN": "B50（b10 + b50 + p50）" },
            value: "refresh",
        },
        {
            name: "Best 55 (New 15 + Best 30 + Recent 10)",
            name_localizations: { "zh-CN": "B55（b15 + b30 + r10）" },
            value: "classic",
        },
    ];

    static readonly themes = [
        {
            name: "オンゲキ Re:Fresh (Japan), landscape",
            name_localizations: {
                "zh-CN": "オンゲキ Re:Fresh（日服），横向",
                "zh-TW": "オンゲキ Re:Fresh（日本），橫向",
            },
            value: "jp-refresh-landscape",
        },
        {
            name: "オンゲキ bright MEMORY (Japan), landscape",
            name_localizations: {
                "zh-CN": "オンゲキ bright MEMORY（日服），横向",
                "zh-TW": "オンゲキ bright MEMORY（日本），橫向",
            },
            value: "jp-brightmemory-landscape",
        },
    ];

    static readonly versions = [
        {
            name: "オンゲキ Re:Fresh (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ Re:Fresh（日服）",
                "zh-TW": "オンゲキ Re:Fresh（日本）",
            },
            value: "jp-refresh",
        },
        {
            name: "オンゲキ Bright MEMORY Act.3 (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ Bright MEMORY Act.3（日服）",
                "zh-TW": "オンゲキ Bright MEMORY Act.3（日本）",
            },
            value: "jp-brightmemoryact3",
        },
        {
            name: "オンゲキ Bright MEMORY Act.2 (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ Bright MEMORY Act.2 （日服）",
                "zh-TW": "オンゲキ Bright MEMORY Act.2 （日本）",
            },
            value: "jp-brightmemoryact2",
        },
        {
            name: "オンゲキ Bright MEMORY Act.1 (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ Bright MEMORY Act.1（日服）",
                "zh-TW": "オンゲキ Bright MEMORY Act.1（日本）",
            },
            value: "jp-brightmemoryact1",
        },
        {
            name: "オンゲキ Bright (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ Bright （日服）",
                "zh-TW": "オンゲキ Bright （日本）",
            },
            value: "jp-sun",
        },
        {
            name: "オンゲキ R.E.D. PLUS (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ R.E.D. PLUS（日服）",
                "zh-TW": "オンゲキ R.E.D. PLUS（日本）",
            },
            value: "jp-redplus",
        },
        {
            name: "オンゲキ R.E.D. (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ R.E.D.（日服）",
                "zh-TW": "オンゲキ R.E.D.（日本）",
            },
            value: "jp-red",
        },
        {
            name: "オンゲキ SUMMER PLUS (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ SUMMER PLUS（日服）",
                "zh-TW": "オンゲキ SUMMER PLUS（日本）",
            },
            value: "jp-summerplus",
        },
        {
            name: "オンゲキ SUMMER (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ SUMMER （日服）",
                "zh-TW": "オンゲキ SUMMER （日本）",
            },
            value: "jp-summer",
        },
        {
            name: "オンゲキ PLUS (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ PLUS（日服）",
                "zh-TW": "オンゲキ PLUS（日本）",
            },
            value: "jp-plus",
        },
        {
            name: "オンゲキ (Japan)",
            name_localizations: {
                "zh-CN": "オンゲキ（日服）",
                "zh-TW": "オンゲキ（日本）",
            },
            value: "jp-ongeki",
        },
    ];

    static getCommand() {
        return [
            {
                type: 2,
                name: "b50",
                description:
                    "Generate a nice little chart of your best 50 scores!",
                description_localizations: {
                    "zh-CN": "生成 b50 图片！",
                    "zh-TW": "生成 Best 50 圖像！",
                },
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "kamai",
                        description: "Get best 50 scores from Kamaitachi.",
                        description_localizations: {
                            "zh-CN": "从 Kamaitachi 获取 b50 信息。",
                            "zh-TW": "從 Kamaitachi 獲取 Best 50 資料。",
                        },
                        options: [
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
                                type: ApplicationCommandOptionType.User,
                                name: "dox",
                                name_localizations: {
                                    "zh-CN": "看看你的",
                                    "zh-TW": "看看你的",
                                },
                                description:
                                    "Get the b50 chart of the selected user.",
                                description_localizations: {
                                    "zh-CN": "看看 ta 的 b50。",
                                    "zh-TW": "看看他的 Best 50 圖像。",
                                },
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "type",
                                name_localizations: {
                                    "zh-CN": "模式",
                                    "zh-TW": "模式",
                                },
                                description:
                                    "Choose between generating Best 60 (platinum 50) or Best 55 (recent 10).",
                                description_localizations: {
                                    "zh-CN":
                                        "选择生成 b60 (b10 + b50 + p50) 或是 b55 (b15 + b30 + r10)。",
                                    "zh-TW":
                                        "選擇生成 Best 60 (platinum 50) 或是 Best 55 (recent 10)。",
                                },
                                choices: this.types,
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "theme",
                                name_localizations: {
                                    "zh-CN": "主题",
                                    "zh-TW": "主題",
                                },
                                description:
                                    "Choose from a variety of themes for your Best 50 chart.",
                                description_localizations: {
                                    "zh-CN": "选择 b50 图片的主题。",
                                    "zh-TW": "選擇 Best 50 圖像的主題。",
                                },
                                choices: this.themes,
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: "version",
                                name_localizations: {
                                    "zh-CN": "版本",
                                    "zh-TW": "版本",
                                },
                                description:
                                    "Select the target version for New Version scores.",
                                description_localizations: {
                                    "zh-CN": "选择 b10/b15 的版本。",
                                    "zh-TW": "選擇 New Version 分數的版本。",
                                },
                                choices: this.versions,
                            },
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
                ],
            },
        ];
    }
}
