import { MessageFlags, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { ChunithmNetAdapter, ChunithmNetEngAdapter } from "maidraw-gcm-net-adapter/chunithm";
import type { MaintenanceSchedule } from "maidraw-gcm-net-adapter/common";
import { MaimaiDxNetAdapter, MaimaiDxNetEngAdapter } from "maidraw-gcm-net-adapter/maimai";
import { OngekiNetAdapter } from "maidraw-gcm-net-adapter/ongeki";
import snakecaseKeys from "snakecase-keys";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

export function getCommand() {
    return new SlashCommandBuilder()
        .setName("whentf_are_they_gonna_maint")
        .setDescription("Find out the next ALL.Net maintenance period.")
        .setDescriptionLocalization("zh-CN", "查看下一次 ALL.Net 服务器维护时间。")
        .addStringOption(
            new SlashCommandStringOption()
                .setName("game")
                .setNameLocalization("zh-CN", "游戏")
                .setNameLocalization("zh-TW", "遊戲")
                .setDescription("The game to check the maintenance period of.")
                .setDescriptionLocalization("zh-CN", "要查询维护时间的游戏。")
                .setDescriptionLocalization("zh-TW", "要查詢維護時間的遊戲。")
                .setRequired(true)
                .addChoices(
                    snakecaseKeys(
                        [
                            {
                                name: "maimai DX International ver.",
                                nameLocalizations: {
                                    "zh-CN": "maimai DX International ver.（国际服）",
                                    "zh-TW": "maimai DX International ver.（國際）",
                                },
                                value: "maimaidx-intl",
                            },
                            {
                                name: "maimaiでらっくす (Japan)",
                                nameLocalizations: {
                                    "zh-CN": "maimaiでらっくす（日服）",
                                    "zh-TW": "maimaiでらっくす（日本）",
                                },
                                value: "maimaidx",
                            },
                            {
                                name: "CHUNITHM (Japan)",
                                nameLocalizations: {
                                    "zh-CN": "中二节奏/CHUNITHM（日服）",
                                    "zh-TW": "CHUNITHM（日本）",
                                },
                                value: "chunithm",
                            },
                            {
                                name: "CHUNITHM International ver.",
                                nameLocalizations: {
                                    "zh-CN": "CHUNITHM International ver.（国际服）",
                                    "zh-TW": "CHUNITHM International ver.（國際）",
                                },
                                value: "chunithm-intl",
                            },
                            {
                                name: "オンゲキ/ONGEKI (Japan)",
                                nameLocalizations: {
                                    "zh-CN": "音击（日服）",
                                    "zh-TW": "音击（日本）",
                                },
                                value: "ongeki",
                            },
                        ],
                        { deep: false },
                    ),
                ),
        );
}

const maimaiDx = new MaimaiDxNetAdapter({ database: void 0 as never });
const maimaiDxIntl = new MaimaiDxNetEngAdapter({ database: void 0 as never });

const chunithm = new ChunithmNetAdapter({ database: void 0 as never });
const chunithmIntl = new ChunithmNetEngAdapter({ database: void 0 as never });

const ongeki = new OngekiNetAdapter({ database: void 0 as never });

function getMaintenanceNotice(startTime: Date, endTime: Date, name?: string) {
    const startTimestamp = startTime.getTime() / 1000;
    const endTimestamp = endTime.getTime() / 1000;
    const currentTimestamp = Date.now() / 1000;
    return `The maintenance period ${name ? `of ${name} ` : ""}${currentTimestamp >= startTimestamp ? "started" : "will start"} at <t:${startTimestamp}:t> (<t:${startTimestamp}:R>), and ${currentTimestamp >= endTimestamp ? "ended" : "will end"} at <t:${endTimestamp}:t> (<t:${endTimestamp}:R>).`;
}

export function getCommandHandler() {
    return Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "whentf_are_they_gonna_maint") return ResultTypes.IGNORED;

        const game = interaction.options.getString("game", true);

        if (game !== "maimaidx" && game !== "maimaidx-intl" && game !== "chunithm" && game !== "chunithm-intl" && game !== "ongeki") {
            await interaction.reply({
                content: "Invalid game.",
            });
            return ResultTypes.ERROR;
        }

        let maintenanceSchedule: MaintenanceSchedule | undefined;
        if (game === "maimaidx") {
            maintenanceSchedule = maimaiDx.maintenanceSchedule;
        } else if (game === "maimaidx-intl") {
            maintenanceSchedule = maimaiDxIntl.maintenanceSchedule;
        } else if (game === "chunithm") {
            maintenanceSchedule = chunithm.maintenanceSchedule;
        } else if (game === "chunithm-intl") {
            maintenanceSchedule = chunithmIntl.maintenanceSchedule;
        } else if (game === "ongeki") {
            maintenanceSchedule = ongeki.maintenanceSchedule;
        }
        if (maintenanceSchedule) {
            await interaction.reply({
                content: getMaintenanceNotice(
                    maintenanceSchedule.getCurrentOrNextWindow().start,
                    maintenanceSchedule.getCurrentOrNextWindow().end,
                    "maimaiでらっくす",
                ),
            });
            return ResultTypes.SUCCESS;
        } else {
            await interaction.reply({
                content: "Failed to get the maintenance schedule.",
                flags: MessageFlags.Ephemeral,
            });
            return ResultTypes.ERROR;
        }
    });
}
