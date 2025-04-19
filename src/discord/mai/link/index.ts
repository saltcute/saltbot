import { client } from "@/discord/client";
import { Events } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { Telemetry } from "@/util/telemetry";
import { EResultTypes } from "@/util/telemetry/type";

export class LinkUserCommand {
    static {
        client.on(
            Events.InteractionCreate,
            Telemetry.discordMiddleware(async (interaction) => {
                if (!interaction.isChatInputCommand())
                    return EResultTypes.IGNORED;
                if (interaction.commandName != "mai")
                    return EResultTypes.IGNORED;
                if (interaction.options.getSubcommandGroup() != "link")
                    return EResultTypes.IGNORED;

                const tracker = interaction.options.getSubcommand();
                let username;
                switch (tracker) {
                    case "kamai": {
                        username = interaction.options.getString("user", true);
                        break;
                    }
                    case "divingfish": {
                        username = interaction.options.getString(
                            "username",
                            true
                        );
                        break;
                    }
                    case "lxns": {
                        username = interaction.options.getString(
                            "friendcode",
                            true
                        );
                        break;
                    }
                }
                switch (tracker) {
                    case "kamai":
                    case "divingfish":
                    case "lxns":
                        kasumi.config.set(
                            `salt::connection.discord.${tracker}.${interaction.user.id}`,
                            username
                        );
                        await interaction.reply({
                            content: `I have linked your discord account to your \`${tracker}\` account \`${username}\`. You can now omit the username field next time you use \`/mai b50 ${tracker}\`.`,
                            ephemeral: true,
                        });
                        break;
                }

                return EResultTypes.LINK_SUCCESS;
            })
        );

        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("maimai::tracker.link.")) {
                const action = interaction.customId.replace(
                    "maimai::tracker.link.",
                    ""
                );
                switch (true) {
                    case action == "nocomment":
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
                                interaction.reply({
                                    content:
                                        "Bruh you shouldn't be seeing this.",
                                    ephemeral: true,
                                });
                                return;
                            }
                            if (
                                !(
                                    tracker == "kamai" ||
                                    tracker == "divingfish" ||
                                    tracker == "lxns"
                                )
                            ) {
                                interaction.reply({
                                    content:
                                        "This shouldn't happen but I don't see the tracker you are using. Please try again.",
                                    ephemeral: true,
                                });
                                return;
                            }
                            kasumi.config.set(
                                `salt::connection.discord.ignore.${tracker}.${userId}`,
                                true
                            );
                            await interaction.update({
                                content: `Okay, I won't bother you again, but you can always use \`/mai link ${tracker}\` to link your account if you changed your mind.`,
                                components: [],
                            });
                            break;
                        }
                    }
                    default: {
                        const [tracker, userId, username] = action.split(".");
                        if (tracker && userId && username) {
                            if (!interaction.user.id) return;
                            if (userId !== interaction.user.id) {
                                interaction.reply({
                                    content:
                                        "Bruh you shouldn't be seeing this.",
                                    ephemeral: true,
                                });
                                return;
                            }
                            if (!username) {
                                interaction.reply({
                                    content:
                                        "This shouldn't happen but I don't see a username. Please try again.",
                                    ephemeral: true,
                                });
                                return;
                            }
                            if (
                                !(
                                    tracker == "kamai" ||
                                    tracker == "divingfish" ||
                                    tracker == "lxns"
                                )
                            ) {
                                interaction.reply({
                                    content:
                                        "This shouldn't happen but I don't see the tracker you are using. Please try again.",
                                    ephemeral: true,
                                });
                                return;
                            }
                            kasumi.config.set(
                                `salt::connection.discord.${tracker}.${userId}`,
                                username
                            );
                            await interaction.update({
                                content: `I have linked your discord account to your \`${tracker}\` account \`${username}\`. You can now omit the username field next time you use the command.`,
                                components: [],
                            });
                        }
                    }
                }
            }
        });
    }

    static getCommand() {
        return [
            {
                type: 2,
                name: "link",
                description:
                    "Link your maimai DX account to your discord account.",
                description_localizations: {
                    "zh-CN": "绑定你的 舞萌DX 账号。",
                    "zh-TW": "連結您的 maimai DX 使用者資料。",
                },
                options: [
                    {
                        type: 1,
                        name: "kamai",
                        description: "Link your Kamaitachi account.",
                        description_localizations: {
                            "zh-CN": "绑定你的 Kamaitachi 账号。",
                            "zh-TW": "連結您的 Kamaitachi 使用者資料。",
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
                                required: true,
                            },
                        ],
                    },
                    {
                        type: 1,
                        name: "lxns",
                        description: "Link your LXNS account.",
                        description_localizations: {
                            "zh-CN": "绑定你的 落雪查分器 账号。",
                            "zh-TW": "連結您的 LXNS 使用者資料。",
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
                        ],
                    },
                    {
                        type: 1,
                        name: "divingfish",
                        description: "Link your DivingFish account.",
                        description_localizations: {
                            "zh-CN": "绑定你的 水鱼查分器 账号。",
                            "zh-TW": "連結您的 DivingFish 使用者資料。",
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
                        ],
                    },
                ],
            },
        ];
    }
}
