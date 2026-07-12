import { client as kasumi } from "@/bot/kook/init/client";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

export class UnlinkUserCommand {
    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "geki") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "unlink") return ResultTypes.IGNORED;

        const tracker = interaction.options.getSubcommand();
        switch (tracker) {
            case "kamai":
            case "gcm-net":
                kasumi.config.set(`salt::connection.discord.${tracker}.${interaction.user.id}`, undefined);
                await interaction.reply({
                    content: `Your \`${tracker}\` account is now unlinked. `,
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
                description: "Unlink your ONGEKI account to your discord account.",
                descriptionLocalizations: {
                    "zh-CN": "取消绑定你的 音击 账号。",
                    "zh-TW": "取消連結您的 音擊 使用者資料。",
                },
                options: [
                    {
                        type: 1,
                        name: "gcm-net",
                        description: "Unlink your オンゲキ-NET account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 オンゲキ-NET 账号。",
                            "zh-TW": "取消連結您的 オンゲキ-NET 使用者資料。",
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
                ],
            },
        ];
    }
}
