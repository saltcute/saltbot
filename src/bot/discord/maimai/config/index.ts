import { getConfig } from "@/bot/core/config";
import { ConfigMenu, ConfigOptions, type ConfigTracker } from "@/bot/util/config-ui";
import { Best50ChartCommand } from "../b50";
import { ChartQueryCommand } from "../chart";
import { FolderCommand } from "../folder";
import { Level50ChartCommand } from "../level50";

const menu = new ConfigMenu("mai", () => {
    const { theme, version, region, source, useProfilePicture, showRecentUpscore } = ConfigOptions;
    const b50Theme = theme(Best50ChartCommand.themes);
    const b50Trackers: (ConfigTracker | false)[] = [
        { value: "gcm-net", name: "maimaiでらっくすNET", options: [b50Theme] },
        { value: "gcm-net-intl", name: "maimai DX NET", options: [b50Theme] },
        { value: "kamai", name: "Kamaitachi", options: [b50Theme, version(Best50ChartCommand.versions), useProfilePicture, showRecentUpscore] },
        !!getConfig("maimai::lxns.token") && {
            value: "lxns",
            name: "LXNS",
            nameLocalizations: { "zh-CN": "落雪查分器" },
            options: [b50Theme, useProfilePicture],
        },
        !!getConfig("maimai::divingFish.token") && {
            value: "divingfish",
            name: "DivingFish",
            nameLocalizations: { "zh-CN": "水鱼查分器" },
            options: [b50Theme],
        },
        { value: "maishift", name: "Maishift", options: [b50Theme, useProfilePicture] },
    ];
    return {
        title: { name: "maimai DX defaults", nameLocalizations: { "zh-CN": "舞萌DX 默认设置", "zh-TW": "maimai DX 預設設定" } },
        commands: [
            { value: "b50", name: "Best 50", trackers: b50Trackers.filter((tracker) => tracker !== false) },
            {
                value: "chart",
                name: "Chart",
                nameLocalizations: { "zh-CN": "谱面详情", "zh-TW": "譜面資料" },
                options: ChartQueryCommand.getCommand().length
                    ? [source(ChartQueryCommand.sources), region(ChartQueryCommand.regions), theme(ChartQueryCommand.themes)]
                    : [],
            },
            {
                value: "folder",
                name: "Folder",
                nameLocalizations: { "zh-CN": "合集", "zh-TW": "合集" },
                options: FolderCommand.getCommand().length ? [source(FolderCommand.sources), theme(FolderCommand.themes)] : [],
            },
            {
                value: "level50",
                name: "Level 50",
                options: [theme(Level50ChartCommand.themes), useProfilePicture],
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
