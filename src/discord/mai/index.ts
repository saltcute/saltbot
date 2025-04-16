import { ChartQueryCommand } from "./chart";
import { Best50ChartCommand } from "./b50";
import { LinkUserCommand } from "./link";

export const maiCommand = {
    type: 1,
    name: "mai",
    description: "Everything about Dance Cube!",
    description_localizations: {
        "zh-CN": "舞萌小工具！",
        "zh-TW": "maimai 小工具！",
    },
    options: [
        ...Best50ChartCommand.getCommand(),
        ...LinkUserCommand.getCommand(),
        ...ChartQueryCommand.getCommand(),
    ],
};
