import { client as kasumi } from "@/bot/kook/init/client";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

export class UnlinkUserCommand {
    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "chu") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "unlink") return ResultTypes.IGNORED;

        const subcommand = interaction.options.getSubcommand();
        const tracker = subcommand === "lxns" ? "lxns-chuni" : subcommand;
        switch (tracker) {
            case "kamai":
            case "lxns-chuni":
            case "gcm-net":
            case "gcm-net-intl":
                kasumi.config.set(`salt::connection.discord.${tracker}.${interaction.user.id}`, undefined);
                await interaction.reply({
                    content: `Your \`${subcommand}\` account is now unlinked. `,
                    ephemeral: true,
                });
                break;
        }

        return ResultTypes.LINK_SUCCESS;
    });

    static getCommand() {
        return [
            {
                type: 2,
                name: "unlink",
                description: "Unlink your CHUNITHM account to your discord account.",
                descriptionLocalizations: {
                    "zh-CN": "取消绑定你的 中二节奏 账号。",
                    "zh-TW": "取消連結您的 CHUNITHM 使用者資料。",
                },
                options: [
                    {
                        type: 1,
                        name: "gcm-net",
                        description: "Unlink your CHUNITHM-NET account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 CHUNITHM-NET 账号。",
                            "zh-TW": "取消連結您的 CHUNITHM-NET 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "gcm-net-intl",
                        description: "Unlink your CHUNITHM-NET (International ver.) account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 CHUNITHM-NET (国际服) 账号。",
                            "zh-TW": "取消連結您的 CHUNITHM-NET (國際版) 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "kamai",
                        description: "Unlink your Kamaitachi account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 Kamaitachi 账号。",
                            "zh-TW": "取消連結您的 Kamaitachi 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "lxns",
                        description: "Unlink your LXNS account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 落雪查分器 账号。",
                            "zh-TW": "取消連結您的 LXNS 使用者資料。",
                        },
                    },
                ],
            },
        ];
    }
}
