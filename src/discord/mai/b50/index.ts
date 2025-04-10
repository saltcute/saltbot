import { AttachmentBuilder, Events } from "discord.js";
import { LXNS, KamaiTachi, DivingFish } from "maidraw";
import { client as kasumi } from "@/kook/init/client";
import { client, maidraw } from "@/discord/client";

const lxns = new LXNS(maidraw, kasumi.config.getSync("maimai::lxns.token"));
const kamai = new KamaiTachi(maidraw);
const divingfish = new DivingFish(maidraw);

export class Best50ChartCommand {
    static {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            if (
                interaction.commandName === "mai" &&
                interaction.options.getSubcommandGroup() == "b50"
            ) {
                let result: Buffer | null = null;
                const version =
                    interaction.options.getString("version", false) ||
                    "jp-prism";
                const theme =
                    interaction.options.getString("theme", false) ||
                    (version ? `${version}-landscape` : "jp-prism-landscape");
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
                        username = interaction.options.getString("username");
                        break;
                    }
                    case "lxns": {
                        username = interaction.options.getString("friendcode");
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
                        switch (version) {
                            case "jp-buddies":
                                result = await maidraw.drawWithScoreSource(
                                    kamai.buddies(),
                                    username,
                                    {
                                        theme,
                                    }
                                );
                                break;
                            case "jp-buddiesplus":
                                result = await maidraw.drawWithScoreSource(
                                    kamai.buddiesplus(),
                                    username,
                                    {
                                        theme,
                                    }
                                );
                                break;
                            case "jp-prism":
                                result = await maidraw.drawWithScoreSource(
                                    kamai.prism(),
                                    username,
                                    {
                                        theme,
                                    }
                                );
                                break;
                            default:
                                result = await maidraw.drawWithScoreSource(
                                    kamai,
                                    username,
                                    {
                                        theme,
                                    }
                                );
                                break;
                        }
                        break;
                    }
                    case "divingfish": {
                        result = await maidraw.drawWithScoreSource(
                            divingfish,
                            username,
                            {
                                theme,
                            }
                        );
                        break;
                    }
                    case "lxns": {
                        result = await maidraw.drawWithScoreSource(
                            lxns,
                            username,
                            {
                                theme,
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
            name: "maimai でらっくす PRiSM PLUS (Japan), landscape",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服），横向",
                "zh-TW": "maimai でらっくす PRiSM（日本），橫向",
            },
            value: "jp-prismplus-landscape",
        },
        {
            name: "maimai でらっくす PRiSM PLUS (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす PRiSM PLUS（日本），縱向",
            },
            value: "jp-prismplus-portrait",
        },
        {
            name: "maimai でらっくす PRiSM (Japan), landscape",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服），横向",
                "zh-TW": "maimai でらっくす PRiSM（日本），橫向",
            },
            value: "jp-prism-landscape",
        },
        {
            name: "maimai でらっくす PRiSM (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす PRiSM（日服），纵向",
                "zh-TW": "maimai でらっくす PRiSM（日本），縱向",
            },
            value: "jp-prism-portrait",
        },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan), landscape",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服），横向",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本），橫向",
            },
            value: "jp-buddiesplus-landscape",
        },
        {
            name: "maimai でらっくす BUDDiES PLUS (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES PLUS（日服），纵向",
                "zh-TW": "maimai でらっくす BUDDiES PLUS（日本），縱向",
            },
            value: "jp-buddiesplus-portrait",
        },
        {
            name: "maimai でらっくす BUDDiES (Japan), landscape",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES（日服），横向",
                "zh-TW": "maimai でらっくす BUDDiES（日本），橫向",
            },
            value: "jp-buddies-landscape",
        },
        {
            name: "maimai でらっくす BUDDiES (Japan), portrait",
            name_localizations: {
                "zh-CN": "maimai でらっくす BUDDiES（日服），纵向",
                "zh-TW": "maimai でらっくす BUDDiES（日本），縱向",
            },
            value: "jp-buddies-portrait",
        },
        {
            name: "舞萌DX 2024 (China), landscape",
            name_localizations: {
                "zh-CN": "舞萌DX 2024（国服），横向",
                "zh-TW": "舞萌DX 2024（中國），橫向",
            },
            value: "cn-2024-landscape",
        },
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
                                    "zh-CN": "选择 b15 的版本。",
                                    "zh-TW": "選擇 New Version 分數的版本。",
                                },
                                choices: this.versions,
                            },
                        ],
                    },
                    {
                        type: 1,
                        name: "lxns",
                        description: "Get best 50 scores from LXNS.",
                        description_localizations: {
                            "zh-CN": "从 落雪查分器 获取 b50 信息。",
                            "zh-TW": "從 LXNS 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: 3,
                                name: "friendcode",
                                name_localizations: {
                                    "zh-CN": "好友码",
                                    "zh-TW": "好友代號",
                                },
                                description:
                                    "You can see your friend code at https://maimai.lxns.net/user/profile.",
                                description_localizations: {
                                    "zh-CN":
                                        "你可以在 https://maimai.lxns.net/user/profile 看到你的好友码。",
                                    "zh-TW":
                                        "您可以在 https://maimai.lxns.net/user/profile 檢視您的好友代號。",
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
                        ],
                    },
                    {
                        type: 1,
                        name: "divingfish",
                        description: "Get best 50 scores from DivingFish.",
                        description_localizations: {
                            "zh-CN": "从 水鱼查分器 获取 b50 信息。",
                            "zh-TW": "從 DivingFish 獲取 Best 50 資料。",
                        },
                        options: [
                            {
                                type: 3,
                                name: "username",
                                name_localizations: {
                                    "zh-CN": "用户名",
                                    "zh-TW": "使用者名稱",
                                },
                                description:
                                    "Use the username you use to log in DivingFish.",
                                description_localizations: {
                                    "zh-CN":
                                        "使用你用来登录水鱼查分器的用户名。",
                                    "zh-TW":
                                        "使用您用來登入 DivingFish 的使用者名稱。",
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
                            },
                        ],
                    },
                ],
            },
        ];
    }
}
