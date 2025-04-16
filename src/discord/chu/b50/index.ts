import { AttachmentBuilder, Events } from "discord.js";
import { MaiDraw } from "maidraw";
import { client as kasumi } from "@/kook/init/client";
import { client } from "@/discord/client";

const kamai = new MaiDraw.Chuni.Best50.KamaiTachi();
export class Best50ChartCommand {
    private static readonly AVAILABLE_VERSION_THEME = ["jp-verse"];
    private static readonly DEFAULT_VERSION = "jp-sunplus";
    private static readonly DEFAULT_THEME = "jp-verse-landscape";
    private static readonly DEFAULT_USE_TRACKER_PROFILE_PICTURE = true;
    static {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            if (
                interaction.commandName === "chu" &&
                interaction.options.getSubcommandGroup() == "b50"
            ) {
                let result: Buffer | null = null;
                const version =
                    interaction.options.getString("version", false) ||
                    this.DEFAULT_VERSION;
                const theme =
                    interaction.options.getString("theme", false) ||
                    (version && this.AVAILABLE_VERSION_THEME.includes(version)
                        ? `${version}-landscape`
                        : this.DEFAULT_THEME);
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
                    return;
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
                if (username == null) {
                    const dbUsername = await kasumi.config.getOne(
                        `salt::connection.discord.${tracker}.${interaction.user.id}`
                    );
                    if (!dbUsername) {
                        await interaction.reply({
                            content: `Please provide your ${tracker == "lxns" ? "friend code" : "username"}. To use without a ${tracker == "lxns" ? "friend code" : "username"}, you need to select "remember my username" after generating a chart or use \`/mai link\` to link your account.`,
                            ephemeral: true,
                        });
                        return;
                    } else {
                        username = dbUsername;
                    }
                }
                await interaction.deferReply();
                switch (tracker) {
                    case "kamai": {
                        let kamaiInstance;
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
                            default:
                                kamaiInstance = kamai;
                                break;
                        }
                        result = await MaiDraw.Chuni.Best50.drawWithScoreSource(
                            kamaiInstance,
                            username,
                            {
                                theme,
                                profilePicture: useProfilePicture
                                    ? undefined
                                    : null,
                            }
                        );
                        break;
                    }
                    case "divingfish": {
                        // result =
                        //     await MaiDraw.Chuni.Best50.drawWithScoreSource(
                        //         divingfish,
                        //         username,
                        //         { theme }
                        //     );
                        break;
                    }
                    case "lxns": {
                        // result =
                        //     await MaiDraw.Chuni.Best50.drawWithScoreSource(
                        //         lxns,
                        //         username,
                        //         {
                        //             theme,
                        //             profilePicture: useProfilePicture
                        //                 ? undefined
                        //                 : null,
                        //         }
                        //     );
                        break;
                    }
                }
                if (!result) {
                    await interaction.editReply({
                        content:
                            "Failed to generate a chart. Please check your input.",
                    });
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
                }
            }
        });
    }

    static readonly themes = [
        {
            name: "CHUNITHM VERSE (Japan), landscape",
            name_localizations: {
                "zh-CN": "CHUNITHM VERSE（日服），横向",
                "zh-TW": "CHUNITHM VERSE（日本），橫向",
            },
            value: "jp-verse-landscape",
        },
    ];

    static readonly versions = [
        {
            name: "CHUNITHM VERSE (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM VERSE（日服）",
                "zh-TW": "CHUNITHM VERSE（日本）",
            },
            value: "jp-verse",
        },
        {
            name: "CHUNITHM LUMINOUS PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM LUMINOUS PLUS（日服）",
                "zh-TW": "CHUNITHM LUMINOUS PLUS（日本）",
            },
            value: "jp-luminousplus",
        },
        {
            name: "CHUNITHM LUMINOUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM LUMINOUS （日服）",
                "zh-TW": "CHUNITHM LUMINOUS （日本）",
            },
            value: "jp-luminous",
        },
        {
            name: "CHUNITHM SUN PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM SUN PLUS（日服）",
                "zh-TW": "CHUNITHM SUN PLUS（日本）",
            },
            value: "jp-sunplus",
        },
        {
            name: "CHUNITHM SUN (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM SUN （日服）",
                "zh-TW": "CHUNITHM SUN （日本）",
            },
            value: "jp-sun",
        },
        {
            name: "CHUNITHM NEW PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM NEW PLUS（日服）",
                "zh-TW": "CHUNITHM NEW PLUS（日本）",
            },
            value: "jp-newplus",
        },
        {
            name: "CHUNITHM NEW (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM NEW （日服）",
                "zh-TW": "CHUNITHM NEW （日本）",
            },
            value: "jp-new",
        },
        {
            name: "CHUNITHM PARADISE LOST (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM PARADISE LOST（日服）",
                "zh-TW": "CHUNITHM PARADISE LOST（日本）",
            },
            value: "jp-paradiselost",
        },
        {
            name: "CHUNITHM PARADISE (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM PARADISE （日服）",
                "zh-TW": "CHUNITHM PARADISE （日本）",
            },
            value: "jp-paradise",
        },
        {
            name: "CHUNITHM CRYSTAL PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM CRYSTAL PLUS（日服）",
                "zh-TW": "CHUNITHM CRYSTAL PLUS（日本）",
            },
            value: "jp-crystalplus",
        },
        {
            name: "CHUNITHM CRYSTAL (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM CRYSTAL（日服）",
                "zh-TW": "CHUNITHM CRYSTAL（日本）",
            },
            value: "jp-crystal",
        },
        {
            name: "CHUNITHM AMAZON PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM AMAZON PLUS（日服）",
                "zh-TW": "CHUNITHM AMAZON PLUS（日本）",
            },
            value: "jp-amazonplus",
        },
        {
            name: "CHUNITHM AMAZON (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM AMAZON（日服）",
                "zh-TW": "CHUNITHM AMAZON（日本）",
            },
            value: "jp-amazon",
        },
        {
            name: "CHUNITHM STAR PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM STAR PLUS（日服）",
                "zh-TW": "CHUNITHM STAR PLUS（日本）",
            },
            value: "jp-starplus",
        },
        {
            name: "CHUNITHM STAR (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM STAR（日服）",
                "zh-TW": "CHUNITHM STAR（日本）",
            },
            value: "jp-star",
        },
        {
            name: "CHUNITHM AIR PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM AIR PLUS（日服）",
                "zh-TW": "CHUNITHM AIR PLUS（日本）",
            },
            value: "jp-airplus",
        },
        {
            name: "CHUNITHM AIR (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM AIR（日服）",
                "zh-TW": "CHUNITHM AIR（日本）",
            },
            value: "jp-air",
        },
        {
            name: "CHUNITHM PLUS (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM PLUS（日服）",
                "zh-TW": "CHUNITHM PLUS（日本）",
            },
            value: "jp-chunithmplus",
        },
        {
            name: "CHUNITHM (Japan)",
            name_localizations: {
                "zh-CN": "CHUNITHM（日服）",
                "zh-TW": "CHUNITHM（日本）",
            },
            value: "jp-chunithm",
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
                        type: 1,
                        name: "kamai",
                        description: "Get best 50 scores from Kamaitachi.",
                        description_localizations: {
                            "zh-CN": "从 Kamaitachi 获取 b50 信息。",
                            "zh-TW": "從 Kamaitachi 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: 3,
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
                                type: 3,
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
                                type: 3,
                                name: "version",
                                name_localizations: {
                                    "zh-CN": "版本",
                                    "zh-TW": "版本",
                                },
                                description:
                                    "Select the target version for New Version scores.",
                                description_localizations: {
                                    "zh-CN": "选择 b20 的版本。",
                                    "zh-TW": "選擇 New Version 分數的版本。",
                                },
                                choices: this.versions,
                            },
                            {
                                type: 5,
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
                    // {
                    //     type: 1,
                    //     name: "lxns",
                    //     description: "Get best 50 scores from LXNS.",
                    //     description_localizations: {
                    //         "zh-CN": "从 落雪查分器 获取 b50 信息。",
                    //         "zh-TW": "從 LXNS 獲取 Best 50 資料。",
                    //     },
                    //     options: [
                    //         {
                    //             type: 3,
                    //             name: "friendcode",
                    //             name_localizations: {
                    //                 "zh-CN": "好友码",
                    //                 "zh-TW": "好友代號",
                    //             },
                    //             description:
                    //                 "You can see your friend code at https://maimai.lxns.net/user/profile.",
                    //             description_localizations: {
                    //                 "zh-CN":
                    //                     "你可以在 https://maimai.lxns.net/user/profile 看到你的好友码。",
                    //                 "zh-TW":
                    //                     "您可以在 https://maimai.lxns.net/user/profile 檢視您的好友代號。",
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
                    //                 "Use your profile picture from LXNS.",
                    //             description_localizations: {
                    //                 "zh-CN": "使用你在 落雪查分器 上的头像。",
                    //                 "zh-TW": "使用您在 LXNS 上的個人資料圖像。",
                    //             },
                    //             choices: this.versions,
                    //         },
                    //     ],
                    // },
                    // {
                    //     type: 1,
                    //     name: "divingfish",
                    //     description: "Get best 50 scores from DivingFish.",
                    //     description_localizations: {
                    //         "zh-CN": "从 水鱼查分器 获取 b50 信息。",
                    //         "zh-TW": "從 DivingFish 獲取 Best 50 資料。",
                    //     },
                    //     options: [
                    //         {
                    //             type: 3,
                    //             name: "username",
                    //             name_localizations: {
                    //                 "zh-CN": "用户名",
                    //                 "zh-TW": "使用者名稱",
                    //             },
                    //             description:
                    //                 "Use the username you use to log in DivingFish.",
                    //             description_localizations: {
                    //                 "zh-CN":
                    //                     "使用你用来登录水鱼查分器的用户名。",
                    //                 "zh-TW":
                    //                     "使用您用來登入 DivingFish 的使用者名稱。",
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
                    //         },
                    //     ],
                    // },
                ],
            },
        ];
    }
}
