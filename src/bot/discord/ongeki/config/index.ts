import { ConfigMenu, ConfigOptions } from "@/bot/util/config-ui";
import { Best50ChartCommand } from "../b50";
import { ChartQueryCommand } from "../chart";

const menu = new ConfigMenu("geki", () => {
    const { theme, version, type, source, useProfilePicture } = ConfigOptions;
    const b50Theme = theme(Best50ChartCommand.themes);
    return {
        title: { name: "O.N.G.E.K.I. defaults", nameLocalizations: { "zh-CN": "音击 默认设置", "zh-TW": "O.N.G.E.K.I. 預設設定" } },
        commands: [
            {
                value: "b50",
                name: "Best 50",
                trackers: [
                    { value: "gcm-net", name: "オンゲキ-NET", options: [b50Theme] },
                    {
                        value: "kamai",
                        name: "Kamaitachi",
                        options: [type(Best50ChartCommand.types), b50Theme, version(Best50ChartCommand.versions), useProfilePicture],
                    },
                ],
            },
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
