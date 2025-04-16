import { Best50ChartCommand } from "./b50";

export const chuCommand = {
    type: 1,
    name: "chu",
    description: "Everything about CHUNITH<!",
    description_localizations: {
        "zh-CN": "中二节奏小工具！",
        "zh-TW": "CHUNITHM 小工具！",
    },
    options: [...Best50ChartCommand.getCommand()],
};
