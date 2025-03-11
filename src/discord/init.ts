import { client } from "@/kook/init/client";
import {
    APIApplicationCommand,
    APIApplicationCommandInteraction,
    ApplicationCommand,
    ApplicationCommandOption,
    REST,
    Routes,
} from "discord.js";

const themes = [
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

const versions = [
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

const commands = [
    {
        type: 1,
        name: "mai",
        description: "Everything about Dance Cube!",
        description_localizations: {
            "zh-CN": "舞萌小工具！",
            "zh-TW": "maimai 小工具！",
        },
        options: [
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
                                name: "userid",
                                name_localizations: {
                                    "zh-CN": "用户id",
                                    "zh-TW": "使用者id",
                                },
                                description:
                                    "You can see your user ID at https://kamai.tachi.ac/u/me.",
                                description_localizations: {
                                    "zh-CN":
                                        "你可以在 https://kamai.tachi.ac/u/me 看到你的用户 ID。",
                                    "zh-TW":
                                        "您可以在 https://kamai.tachi.ac/u/me 檢視您的使用者 ID。",
                                },
                                required: true,
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
                                choices: themes,
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
                                choices: versions,
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
                                required: true,
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
                                choices: themes,
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
                                required: true,
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
                                choices: themes,
                            },
                        ],
                    },
                ],
            },
        ],
    },
];
(async () => {
    const rest = new REST({ version: "10" }).setToken(
        client.config.getSync("discord::auth.token")
    );

    try {
        client.logger.info("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationCommands(
                client.config.getSync("discord::auth.clientId")
            ),
            { body: commands }
        );

        client.logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        client.logger.error(error);
    }
})();
