import { client as kasumi } from "@/bot/kook/init/client";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

export class UnlinkUserCommand {
    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "mai") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup() !== "unlink") return ResultTypes.IGNORED;

        const tracker = interaction.options.getSubcommand();
        switch (tracker) {
            case "kamai":
            case "divingfish":
            case "lxns":
            case "maishift":
            case "gcm-net":
            case "gcm-net-intl":
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
                description: "Unlink your maimai DX account to your discord account.",
                descriptionLocalizations: {
                    "zh-CN": "取消绑定你的 舞萌DX 账号。",
                    "zh-TW": "取消連結您的 maimai DX 使用者資料。",
                },
                options: [
                    {
                        type: 1,
                        name: "gcm-net",
                        description: "Unlink your maimaiでらっくすNET account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 maimaiでらっくすNET 账号。",
                            "zh-TW": "取消連結您的 maimaiでらっくすNET 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "gcm-net-intl",
                        description: "Unlink your maimai DX NET account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 maimai DX NET 账号。",
                            "zh-TW": "取消連結您的 maimai DX NET 使用者資料。",
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
                    {
                        type: 1,
                        name: "divingfish",
                        description: "Unlink your DivingFish account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 水鱼查分器 账号。",
                            "zh-TW": "取消連結您的 DivingFish 使用者資料。",
                        },
                    },
                    {
                        type: 1,
                        name: "maishift",
                        description: "Unlink your Maishift account.",
                        descriptionLocalizations: {
                            "zh-CN": "取消绑定你的 Maishift 账号。",
                            "zh-TW": "取消連結您的 Maishift 使用者資料。",
                        },
                    },
                ],
            },
        ];
    }
}
