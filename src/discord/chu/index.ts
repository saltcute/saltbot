import { Best50ChartCommand } from "./b50";
import { LinkUserCommand } from "./link";

export const chuCommand = {
    type: 1,
    name: "chu",
    description: "Everything about CHUNITHM!",
    description_localizations: {
        "zh-CN": "中二节奏小工具！",
        "zh-TW": "CHUNITHM 小工具！",
    },
    options: [
        ...Best50ChartCommand.getCommand(),
        ...LinkUserCommand.getCommand(),
    ],
};
