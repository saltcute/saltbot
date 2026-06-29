import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type Interaction, MessageFlags } from "discord.js";
import { client as kasumi } from "@/bot/kook/init/client";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

export class LinkUserCommand {
    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "mai") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "link") return ResultTypes.IGNORED;

        const tracker = interaction.options.getSubcommand();
        let username: string | undefined;
        switch (tracker) {
            case "kamai": {
                username = interaction.options.getString("user", true);
                break;
            }
            case "divingfish": {
                username = interaction.options.getString("username", true);
                break;
            }
            case "lxns": {
                username = interaction.options.getString("friendcode", true);
                break;
            }
            case "maishift": {
                username = interaction.options.getString("username", true);
                break;
            }
        }
        if (!(tracker === "gcm-net" || tracker === "gcm-net-ex") && !username) {
            await interaction.reply({
                content: "Please provide your username.",
                flags: MessageFlags.Ephemeral,
            });
            return ResultTypes.INVALID_USERNAME;
        }
        switch (tracker) {
            case "kamai":
            case "divingfish":
            case "lxns":
            case "maishift":
                kasumi.config.set(`salt::connection.discord.${tracker}.${interaction.user.id}`, username);
                await interaction.reply({
                    content: `I have linked your discord account to your \`${tracker}\` account \`${username}\`. You can now omit the username field next time you use \`/mai b50 ${tracker}\`.`,
                    ephemeral: true,
                });
                break;
            case "gcm-net":
            case "gcm-net-ex": {
                const baseUrl = (kasumi.config.getSync("webui::config.baseUrl") || "").replace(/\/+$/, "");
                const linkUrl = `${baseUrl}/link?tracker=${tracker}`;
                await interaction.reply({
                    content: `Before linking your ${tracker === "gcm-net-ex" ? "maimai DX NET" : "maimaiでらっくすNET"} account to saltbot,
please note the following **VERY IMPORTANT** information.

- Your Sega ID and **password** is required.
- You are generally discouraged to provide your password to any person.
- We make our best effort to keep your information secure. However, make sure to create a unique password specifically for this service in order to reduce the risk of cyber attacks.
${tracker === "gcm-net-ex" ? "- You must use a Sega ID to log into your account. Partner login like X (Twitter) or Facebook login will not work." : ""}

If you wish to proceed, please click "Continue".`,

                    components: [
                        new ActionRowBuilder()
                            .addComponents(new ButtonBuilder().setLabel("Continue").setStyle(ButtonStyle.Link).setURL(linkUrl))
                            .toJSON(),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        return ResultTypes.LINK_SUCCESS;
    });

    static readonly BUTTON_HANDLER = async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId.startsWith("maimai::tracker.link.")) {
            const action = interaction.customId.replace("maimai::tracker.link.", "");
            switch (true) {
                case action === "nocomment":
                    await interaction.update({
                        content: "Okay, I will remind you the next time.",
                        components: [],
                    });
                    break;
                case action.startsWith("ignore"): {
                    const [_, tracker, userId] = action.split(".");
                    if (tracker && userId) {
                        if (!interaction.user.id) return;
                        if (userId !== interaction.user.id) {
                            await interaction.reply({
                                content: "Bruh you shouldn't be seeing this.",
                                ephemeral: true,
                            });
                            return;
                        }
                        if (!(tracker === "kamai" || tracker === "divingfish" || tracker === "lxns" || tracker === "maishift")) {
                            await interaction.reply({
                                content: "This shouldn't happen but I don't see the tracker you are using. Please try again.",
                                ephemeral: true,
                            });
                            return;
                        }
                        kasumi.config.set(`salt::connection.discord.ignore.${tracker}.${userId}`, true);
                        await interaction.update({
                            content: `Okay, I won't bother you again, but you can always use \`/mai link ${tracker}\` to link your account if you changed your mind.`,
                            components: [],
                        });
                        break;
                    }
                    break;
                }
                default: {
                    const [tracker, userId, username] = action.split(".");

                    if (tracker && userId && username) {
                        if (!interaction.user.id) return;
                        if (userId !== interaction.user.id) {
                            await interaction.reply({
                                content: "Bruh you shouldn't be seeing this.",
                                ephemeral: true,
                            });
                            return;
                        }
                        if (!username) {
                            await interaction.reply({
                                content: "This shouldn't happen but I don't see a username. Please try again.",
                                ephemeral: true,
                            });
                            return;
                        }
                        if (!(tracker === "kamai" || tracker === "divingfish" || tracker === "lxns" || tracker === "maishift")) {
                            await interaction.reply({
                                content: "This shouldn't happen but I don't see the tracker you are using. Please try again.",
                                ephemeral: true,
                            });
                            return;
                        }
                        kasumi.config.set(`salt::connection.discord.${tracker}.${userId}`, username);
                        await interaction.update({
                            content: `I have linked your discord account to your \`${tracker}\` account \`${username}\`. You can now omit the username field next time you use the command.`,
                            components: [],
                        });
                    }
                }
            }
        }
    };

    static getCommand() {
        return [
            {
                type: 2,
                name: "link",
                description: "Link your maimai DX account to your discord account.",
                descriptionLocalizations: {
                    "zh-CN": "绑定你的 舞萌DX 账号。",
                    "zh-TW": "連結您的 maimai DX 使用者資料。",
                },
                options: [
                    {
                        type: 1,
                        name: "gcm-net",
                        description: "Link your maimaiでらっくすNET account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 maimaiでらっくすNET 账号。",
                            "zh-TW": "連結您的 maimaiでらっくすNET 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "gcm-net-ex",
                        description: "Link your maimai DX NET account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 maimai DX NET 账号。",
                            "zh-TW": "連結您的 maimai DX NET 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "kamai",
                        description: "Link your Kamaitachi account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 Kamaitachi 账号。",
                            "zh-TW": "連結您的 Kamaitachi 使用者資料。",
                        },
                        options: [
                            {
                                type: 3,
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
                                required: true,
                            },
                        ],
                    },
                    {
                        type: 1,
                        name: "lxns",
                        description: "Link your LXNS account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 落雪查分器 账号。",
                            "zh-TW": "連結您的 LXNS 使用者資料。",
                        },
                        options: [
                            {
                                type: 3,
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
                                required: true,
                            },
                        ],
                    },
                    {
                        type: 1,
                        name: "divingfish",
                        description: "Link your DivingFish account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 水鱼查分器 账号。",
                            "zh-TW": "連結您的 DivingFish 使用者資料。",
                        },
                        options: [
                            {
                                type: 3,
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
                                required: true,
                            },
                        ],
                    },
                    {
                        type: 1,
                        name: "maishift",
                        description: "Link your Maishift account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 Maishift 账号。",
                            "zh-TW": "連結您的 Maishift 使用者資料。",
                        },
                        options: [
                            {
                                type: 3,
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
                                required: true,
                            },
                        ],
                    },
                ],
            },
        ];
    }
}
