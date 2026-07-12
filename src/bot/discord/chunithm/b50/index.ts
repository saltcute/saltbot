import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import type { DataOrError } from "maidraw";
import { BestPainter } from "maidraw/chunithm";
import { ChunithmNetAdapter, ChunithmNetEngAdapter } from "maidraw-gcm-net-adapter/chunithm";
import { isAllNetMaintenance } from "maidraw-gcm-net-adapter/common";
import { KamaiTachiScoreAdapter } from "maidraw-kamai-tachi-adapter/chunithm";
import { LxnsScoreAdapter } from "maidraw-lxns-adapter/chunithm";
import { client as kasumi } from "@/bot/kook/init/client";
import { Util } from "@/bot/util/index";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";
import { database, otogedb, otogedbIntl } from "../database";

const kamai = new KamaiTachiScoreAdapter({ database });
const lxns = new LxnsScoreAdapter({
    auth: kasumi.config.getSync("maimai::lxns.token"),
    database,
});
const gcmNet = new ChunithmNetAdapter({ database: otogedb });
const gcmNetIntl = new ChunithmNetEngAdapter({ database: otogedbIntl });

const painter = new BestPainter(database);
const otogeDbPainter = new BestPainter(otogedb);
const otogeDbIntlPainter = new BestPainter(otogedbIntl);

export class Best50ChartCommand {
    private static readonly AVAILABLE_VERSION_THEME = [
        "jp-mate",
        "jp-xversex",
        "jp-xverse",
        "jp-verse",
        "jp-luminousplus",
        "jp-luminous",
        "jp-paradiselost",
    ];
    private static readonly DEFAULT_VERSION_BY_TRACKER = {
        kamai: "jp-verse",
        "lxns-chuni": "cn-2025",
        "gcm-net": "jp-mate",
        "gcm-net-intl": "jp-xversex",
    };
    private static readonly DEFAULT_THEME_BY_TRACKER = {
        kamai: "jp-verse-landscape",
        "lxns-chuni": "jp-verse-landscape",
        "gcm-net": "jp-mate-landscape",
        "gcm-net-intl": "jp-xversex-landscape",
    };
    private static readonly DEFAULT_USE_TRACKER_PROFILE_PICTURE = true;
    private static readonly DEFAULT_RATING_ALOGRITHM = "new";

    private static readonly DEFAULT_VERSION_RATING_ALOGRITHM_MAP: Record<string, "new" | "recents"> = {
        "jp-mate": "new",
        "jp-xversex": "new",
        "jp-xverse": "new",
        "jp-verse": "new",
        "jp-luminousplus": "recents",
        "jp-luminous": "recents",
        "jp-sunplus": "recents",
        "jp-sun": "recents",
        "jp-newplus": "recents",
        "jp-new": "recents",
        "jp-paradiselost": "recents",
        "jp-paradise": "recents",
        "jp-crystalplus": "recents",
        "jp-crystal": "recents",
        "jp-amazonplus": "recents",
        "jp-amazon": "recents",
        "jp-starplus": "recents",
        "jp-star": "recents",
        "jp-airplus": "recents",
        "jp-air": "recents",
        "jp-chunithmplus": "recents",
        "jp-chunithm": "recents",
    };
    static CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "chu") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "b50") return ResultTypes.IGNORED;

        let result: DataOrError<Buffer>;

        const subCommand = interaction.options.getSubcommand();
        const tracker = subCommand === "lxns" ? "lxns-chuni" : subCommand;
        if (
            !(
                tracker === "kamai" ||
                // tracker == "divingfish" ||
                tracker === "lxns-chuni" ||
                tracker === "gcm-net" ||
                tracker === "gcm-net-intl"
            )
        ) {
            await interaction.reply({
                content: "Invalid tracker. Please try again.",
                ephemeral: true,
            });
            return ResultTypes.INVALID_TRACKER;
        }
        const version = interaction.options.getString("version", false) || this.DEFAULT_VERSION_BY_TRACKER[tracker];
        const maiDrawVersion = (() => {
            switch (version) {
                case "jp-chunithm":
                case "jp-chunithmplus":
                case "jp-air":
                case "jp-airplus":
                case "jp-star":
                case "jp-starplus":
                case "jp-amazon":
                case "jp-amazonplus":
                    return "chunithm";
                case "jp-crystal":
                case "jp-crystalplus":
                case "jp-paradise":
                case "jp-paradiselost":
                    return "crystal";
                case "jp-new":
                case "jp-newplus":
                case "jp-sun":
                case "jp-sunplus":
                case "jp-luminous":
                case "jp-luminousplus":
                    return "new";
                default:
                    return "verse";
            }
        })();
        const type =
            interaction.options.getString("type", false) === "recents"
                ? "recents"
                : interaction.options.getString("type", false) === "new"
                  ? "new"
                  : this.DEFAULT_VERSION_RATING_ALOGRITHM_MAP[version] || this.DEFAULT_RATING_ALOGRITHM;
        const theme =
            (interaction.options.getString("theme", false) ||
                (version && this.AVAILABLE_VERSION_THEME.includes(version) ? `${version}-landscape` : this.DEFAULT_THEME_BY_TRACKER[tracker])) +
            "-" +
            type;
        const pfpOption = interaction.options.getBoolean("use_profile_picture", false);
        const useProfilePicture = pfpOption == null ? this.DEFAULT_USE_TRACKER_PROFILE_PICTURE : pfpOption;
        let username: string | null = null;
        switch (tracker) {
            case "kamai": {
                username = interaction.options.getString("user");
                break;
            }
            // case "divingfish": {
            //     // username = interaction.options.getString("username");
            //     break;
            // }
            case "lxns-chuni": {
                username = interaction.options.getString("friendcode");
                break;
            }
        }
        const mention = interaction.options.getUser("dox");
        if (username == null) {
            if (mention) {
                const dbUsername = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${mention.id}`);
                if (!dbUsername) {
                    await interaction.reply({
                        content: `This user has not connected their ${tracker} ${tracker === "lxns-chuni" ? "friend code" : "username"} to their Discord account.`,
                        ephemeral: true,
                    });
                    return ResultTypes.INVALID_USERNAME;
                } else username = dbUsername;
            } else {
                const dbUsername = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${interaction.user.id}`);
                if (!dbUsername) {
                    if (tracker === "gcm-net" || tracker === "gcm-net-intl") {
                        await interaction.reply({
                            content: `Please link your Sega ID using \`/chu link ${tracker}\``,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: `Please provide your ${tracker === "lxns-chuni" ? "friend code" : "username"}. To use without a ${tracker === "lxns-chuni" ? "friend code" : "username"}, you need to select "remember my username" after generating a chart or use \`/chu link\` to link your account.`,
                            ephemeral: true,
                        });
                    }
                    return ResultTypes.INVALID_USERNAME;
                } else username = dbUsername;
            }
        }
        if (tracker === "gcm-net") {
            if (isAllNetMaintenance(2)) {
                await Util.allNetMaintenanceNotice(interaction, 2, "chunithm");
                return ResultTypes.ERROR;
            }
        }
        if (tracker === "gcm-net-intl") {
            if (isAllNetMaintenance()) {
                await Util.allNetMaintenanceNotice(interaction);
                return ResultTypes.ERROR;
            }
        }
        await interaction.deferReply();
        switch (tracker) {
            case "kamai": {
                let kamaiInstance: KamaiTachiScoreAdapter;
                switch (version) {
                    case "jp-chunithm":
                        kamaiInstance = kamai.chunithm();
                        break;
                    case "jp-chunithmplus":
                        kamaiInstance = kamai.plus();
                        break;
                    case "jp-air":
                        kamaiInstance = kamai.air();
                        break;
                    case "jp-airplus":
                        kamaiInstance = kamai.airPlus();
                        break;
                    case "jp-star":
                        kamaiInstance = kamai.star();
                        break;
                    case "jp-starplus":
                        kamaiInstance = kamai.starPlus();
                        break;
                    case "jp-amazon":
                        kamaiInstance = kamai.amazon();
                        break;
                    case "jp-amazonplus":
                        kamaiInstance = kamai.amazonPlus();
                        break;
                    case "jp-crystal":
                        kamaiInstance = kamai.crystal();
                        break;
                    case "jp-crystalplus":
                        kamaiInstance = kamai.crystalPlus();
                        break;
                    case "jp-paradise":
                        kamaiInstance = kamai.paradise();
                        break;
                    case "jp-paradiselost":
                        kamaiInstance = kamai.paradiseLost();
                        break;
                    case "jp-new":
                        kamaiInstance = kamai.new();
                        break;
                    case "jp-newplus":
                        kamaiInstance = kamai.newPlus();
                        break;
                    case "jp-sun":
                        kamaiInstance = kamai.sun();
                        break;
                    case "jp-sunplus":
                        kamaiInstance = kamai.sunPlus();
                        break;
                    case "jp-luminous":
                        kamaiInstance = kamai.luminous();
                        break;
                    case "jp-luminousplus":
                        kamaiInstance = kamai.luminousPlus();
                        break;
                    case "jp-verse":
                        kamaiInstance = kamai.verse();
                        break;
                    case "jp-xverse":
                        kamaiInstance = kamai.xverse();
                        break;
                    case "jp-xversex":
                        kamaiInstance = kamai.xversex();
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
                        profilePicture: useProfilePicture ? undefined : null,
                        type,
                        version: maiDrawVersion,
                    },
                );
                break;
            }
            // case "divingfish": {
            //     // result =
            //     //     await MaiDraw.Chuni.Best50.drawWithScoreSource(
            //     //         divingfish,
            //     //         username,
            //     //         { theme }
            //     //     );
            //     break;
            // }
            case "lxns-chuni": {
                result = await painter.drawWithScoreSource(
                    lxns,
                    { username },
                    {
                        theme,
                        profilePicture: useProfilePicture ? undefined : null,
                        type: "new",
                    },
                );
                break;
            }
            case "gcm-net": {
                result = await otogeDbPainter.drawWithScoreSource(gcmNet, { username }, { theme });
                break;
            }
            case "gcm-net-intl": {
                result = await otogeDbIntlPainter.drawWithScoreSource(gcmNetIntl, { username }, { theme });
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
                                    customId: `chuni::tracker.link.${tracker}.${interaction.user.id}.${username}`,
                                },
                                {
                                    type: 2,
                                    label: "Later",
                                    style: 3,
                                    customId: `chuni::tracker.link.nocomment`,
                                },
                                {
                                    type: 2,
                                    label: "GO MIND YOUR OWN BUSINESS",
                                    style: 4,
                                    customId: `chuni::tracker.link.ignore.${tracker}.${interaction.user.id}`,
                                },
                            ],
                        },
                    ],
                });
            }
            return ResultTypes.GENERATE_SUCCESS;
        }
    });
    static readonly types = [
        {
            name: "Best 50 (New 20 + Old 30)",
            nameLocalizations: { "zh-CN": "B50（b20 + b30）" },
            value: "new",
        },
        {
            name: "Best 40 (Recent 10 + Best 30)",
            nameLocalizations: { "zh-CN": "B50（r10 + b30）" },
            value: "recents",
        },
    ];

    static readonly themes = [
        {
            name: "CHUNITHM MATE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM MATE（日服）",
                "zh-TW": "CHUNITHM MATE（日本）",
            },
            value: "jp-mate-landscape",
        },
        {
            name: "CHUNITHM X-VERSE-X (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM X-VERSE-X（日服）",
                "zh-TW": "CHUNITHM X-VERSE-X（日本）",
            },
            value: "jp-xversex-landscape",
        },
        {
            name: "CHUNITHM X-VERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM X-VERSE（日服）",
                "zh-TW": "CHUNITHM X-VERSE（日本）",
            },
            value: "jp-xverse-landscape",
        },
        {
            name: "CHUNITHM VERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM VERSE（日服）",
                "zh-TW": "CHUNITHM VERSE（日本）",
            },
            value: "jp-verse-landscape",
        },
        {
            name: "CHUNITHM LUMINOUS PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM LUMINOUS PLUS（日服）",
                "zh-TW": "CHUNITHM LUMINOUS PLUS（日本）",
            },
            value: "jp-luminousplus-landscape",
        },
        {
            name: "CHUNITHM LUMINOUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM LUMINOUS（日服）",
                "zh-TW": "CHUNITHM LUMINOUS（日本）",
            },
            value: "jp-luminous-landscape",
        },
        {
            name: "CHUNITHM PARADISE LOST (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM PARADISE LOST（日服）",
                "zh-TW": "CHUNITHM PARADISE LOST（日本）",
            },
            value: "jp-paradiselost-landscape",
        },
    ];

    static readonly versions = [
        {
            name: "CHUNITHM X-VERSE-X (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM X-VERSE-X（日服）",
                "zh-TW": "CHUNITHM X-VERSE-X（日本）",
            },
            value: "jp-xversex",
        },
        {
            name: "CHUNITHM X-VERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM X-VERSE（日服）",
                "zh-TW": "CHUNITHM X-VERSE（日本）",
            },
            value: "jp-xverse",
        },
        {
            name: "CHUNITHM VERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM VERSE（日服）",
                "zh-TW": "CHUNITHM VERSE（日本）",
            },
            value: "jp-verse",
        },
        {
            name: "CHUNITHM LUMINOUS PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM LUMINOUS PLUS（日服）",
                "zh-TW": "CHUNITHM LUMINOUS PLUS（日本）",
            },
            value: "jp-luminousplus",
        },
        {
            name: "CHUNITHM LUMINOUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM LUMINOUS （日服）",
                "zh-TW": "CHUNITHM LUMINOUS （日本）",
            },
            value: "jp-luminous",
        },
        {
            name: "CHUNITHM SUN PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM SUN PLUS（日服）",
                "zh-TW": "CHUNITHM SUN PLUS（日本）",
            },
            value: "jp-sunplus",
        },
        {
            name: "CHUNITHM SUN (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM SUN（日服）",
                "zh-TW": "CHUNITHM SUN（日本）",
            },
            value: "jp-sun",
        },
        {
            name: "CHUNITHM NEW PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM NEW PLUS（日服）",
                "zh-TW": "CHUNITHM NEW PLUS（日本）",
            },
            value: "jp-newplus",
        },
        {
            name: "CHUNITHM NEW (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM NEW（日服）",
                "zh-TW": "CHUNITHM NEW（日本）",
            },
            value: "jp-new",
        },
        {
            name: "CHUNITHM PARADISE LOST (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM PARADISE LOST（日服）",
                "zh-TW": "CHUNITHM PARADISE LOST（日本）",
            },
            value: "jp-paradiselost",
        },
        {
            name: "CHUNITHM PARADISE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM PARADISE（日服）",
                "zh-TW": "CHUNITHM PARADISE（日本）",
            },
            value: "jp-paradise",
        },
        {
            name: "CHUNITHM CRYSTAL PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM CRYSTAL PLUS（日服）",
                "zh-TW": "CHUNITHM CRYSTAL PLUS（日本）",
            },
            value: "jp-crystalplus",
        },
        {
            name: "CHUNITHM CRYSTAL (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM CRYSTAL（日服）",
                "zh-TW": "CHUNITHM CRYSTAL（日本）",
            },
            value: "jp-crystal",
        },
        {
            name: "CHUNITHM AMAZON PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM AMAZON PLUS（日服）",
                "zh-TW": "CHUNITHM AMAZON PLUS（日本）",
            },
            value: "jp-amazonplus",
        },
        {
            name: "CHUNITHM AMAZON (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM AMAZON（日服）",
                "zh-TW": "CHUNITHM AMAZON（日本）",
            },
            value: "jp-amazon",
        },
        {
            name: "CHUNITHM STAR PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM STAR PLUS（日服）",
                "zh-TW": "CHUNITHM STAR PLUS（日本）",
            },
            value: "jp-starplus",
        },
        {
            name: "CHUNITHM STAR (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM STAR（日服）",
                "zh-TW": "CHUNITHM STAR（日本）",
            },
            value: "jp-star",
        },
        {
            name: "CHUNITHM AIR PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM AIR PLUS（日服）",
                "zh-TW": "CHUNITHM AIR PLUS（日本）",
            },
            value: "jp-airplus",
        },
        {
            name: "CHUNITHM AIR (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM AIR（日服）",
                "zh-TW": "CHUNITHM AIR（日本）",
            },
            value: "jp-air",
        },
        {
            name: "CHUNITHM PLUS (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM PLUS（日服）",
                "zh-TW": "CHUNITHM PLUS（日本）",
            },
            value: "jp-chunithmplus",
        },
        {
            name: "CHUNITHM (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM（日服）",
                "zh-TW": "CHUNITHM（日本）",
            },
            value: "jp-chunithm",
        },
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
                        description: "Get best 50 scores from CHUNITHM-NET.",
                        descriptionLocalizations: {
                            "zh-CN": "从 CHUNITHM-NET 获取 b50 信息。",
                            "zh-TW": "從 CHUNITHM-NET 獲取 Best 50 資料。",
                        },
                        options: [
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
                                choices: Best50ChartCommand.themes,
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "gcm-net-intl",
                        description: "Get best 50 scores from CHUNITHM-NET (International ver.).",
                        descriptionLocalizations: {
                            "zh-CN": "从 CHUNITHM-NET (国际版) 获取 b50 信息。",
                            "zh-TW": "從 CHUNITHM-NET (國際版) 獲取 Best 50 資料。",
                        },
                        options: [
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
                                choices: Best50ChartCommand.themes,
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
                                name: "type",
                                nameLocalizations: {
                                    "zh-CN": "模式",
                                    "zh-TW": "模式",
                                },
                                description: "Choose between generating Best 40 (recents 10) or Best 50 (new 20).",
                                descriptionLocalizations: {
                                    "zh-CN": "选择生成 b40 (r10 + b30) 或是 b50 (b20 + b30)。",
                                    "zh-TW": "選擇生成 Best 40 (recents 10) 或是 Best 50 (new 20)。",
                                },
                                choices: Best50ChartCommand.types,
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
                                choices: Best50ChartCommand.themes,
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
                                    "zh-CN": "选择 b20 的版本。",
                                    "zh-TW": "選擇 New Version 分數的版本。",
                                },
                                choices: Best50ChartCommand.versions,
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
                                choices: Best50ChartCommand.versions,
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
                                              choices: Best50ChartCommand.themes,
                                          },
                                          // {
                                          //     type: ApplicationCommandOptionType.Boolean,
                                          //     name: "use_profile_picture",
                                          //     nameLocalizations: {
                                          //         "zh-CN": "使用头像",
                                          //         "zh-TW": "使用個人資料圖像",
                                          //     },
                                          //     description:
                                          //         "Use your profile picture from LXNS.",
                                          //     descriptionLocalizations: {
                                          //         "zh-CN": "使用你在 落雪查分器 上的头像。",
                                          //         "zh-TW": "使用您在 LXNS 上的個人資料圖像。",
                                          //     },
                                          //     choices: this.versions,
                                          // },
                                      ],
                                  },
                              ]
                            : [];
                    })(),
                ],
            },
        ];
    }
}
