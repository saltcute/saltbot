import { getConfig } from "@/bot/core/config";
import { ConfigMenu, ConfigOptions, type ConfigTracker } from "@/bot/util/config-ui";
import { Best50ChartCommand } from "../b50";
import { ChartQueryCommand } from "../chart";

const menu = new ConfigMenu("chu", () => {
    const { theme, version, type, source, useProfilePicture } = ConfigOptions;
    const b50Theme = theme(Best50ChartCommand.themes);
    const b50Trackers: (ConfigTracker | false)[] = [
        { value: "gcm-net", name: "CHUNITHM-NET", options: [b50Theme] },
        { value: "gcm-net-intl", name: "CHUNITHM-NET International", options: [b50Theme] },
        {
            value: "kamai",
            name: "Kamaitachi",
            options: [type(Best50ChartCommand.types), b50Theme, version(Best50ChartCommand.versions), useProfilePicture],
        },
        !!getConfig("maimai::lxns.token") && {
            value: "lxns-chuni",
            name: "LXNS",
            nameLocalizations: { "zh-CN": "落雪查分器" },
            options: [b50Theme],
        },
    ];
    return {
        title: { name: "CHUNITHM defaults", nameLocalizations: { "zh-CN": "中二节奏 默认设置", "zh-TW": "CHUNITHM 預設設定" } },
        commands: [
            { value: "b50", name: "Best 50", trackers: b50Trackers.filter((tracker) => tracker !== false) },
            {
                value: "chart",
                name: "Chart",
                nameLocalizations: { "zh-CN": "谱面详情", "zh-TW": "譜面資料" },
                options: ChartQueryCommand.getCommand().length
                    ? [type(ChartQueryCommand.types), source(ChartQueryCommand.sources), theme(ChartQueryCommand.themes)]
                    : [],
            },
        ],
    };
});

export class ConfigCommand {
    static readonly CHAT_COMMAND_HANDLER = menu.chatCommandHandler;
    static readonly COMPONENT_HANDLER = menu.componentHandler;
    static getCommand() {
        return menu.getCommand();
    }
}
