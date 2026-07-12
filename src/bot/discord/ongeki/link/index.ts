import { type Interaction, MessageFlags } from "discord.js";
import { client as kasumi } from "@/bot/kook/init/client";
import { Util } from "@/bot/util";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

export class LinkUserCommand {
    static CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "geki") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "link") return ResultTypes.IGNORED;

        const tracker = interaction.options.getSubcommand();
        let username: string | undefined;
        switch (tracker) {
            case "kamai": {
                username = interaction.options.getString("user", true);
                break;
            }
        }
        if (!(tracker === "gcm-net") && !username) {
            await interaction.reply({
                content: "Please provide your username.",
                flags: MessageFlags.Ephemeral,
            });
            return ResultTypes.INVALID_USERNAME;
        }
        switch (tracker) {
            case "kamai":
                kasumi.config.set(`salt::connection.discord.${tracker}.${interaction.user.id}`, username);
                await interaction.reply({
                    content: `I have linked your discord account to your \`${tracker}\` account \`${username}\`. You can now omit the username field next time you use \`/geki b50 ${tracker}\`.`,
                    flags: MessageFlags.Ephemeral,
                });
                break;
            case "gcm-net":
            case "gcm-net-intl": {
                await Util.gcmNetLinkNotice(interaction, tracker, "ongeki");
            }
        }

        return ResultTypes.LINK_SUCCESS;
    });

    static readonly BUTTON_HANDLER = async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId.startsWith("ongeki::tracker.link.")) {
            const action = interaction.customId.replace("ongeki::tracker.link.", "");
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
                        if (!(tracker === "kamai")) {
                            await interaction.reply({
                                content: "This shouldn't happen but I don't see the tracker you are using. Please try again.",
                                ephemeral: true,
                            });
                            return;
                        }
                        kasumi.config.set(`salt::connection.discord.ignore.${tracker}.${userId}`, true);
                        await interaction.update({
                            content: `Okay, I won't bother you again, but you can always use \`/geki link ${tracker}\` to link your account if you changed your mind.`,
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
                        if (!(tracker === "kamai")) {
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
                description: "Link your ONGEKI account to your discord account.",
                descriptionLocalizations: {
                    "zh-CN": "绑定你的 音击 账号。",
                    "zh-TW": "連結您的 音擊 使用者資料。",
                },
                options: [
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
                        name: "gcm-net",
                        description: "Link your オンゲキ-NET account.",
                        descriptionLocalizations: {
                            "zh-CN": "绑定你的 オンゲキ-NET 账号。",
                            "zh-TW": "連結您的 オンゲキ-NET 使用者資料。",
                        },
                    },
                ],
            },
        ];
    }
}
