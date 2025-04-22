import { Best50ChartCommand } from "./b50";

export const gekiCommand = {
    type: 1,
    name: "geki",
    description: "Everything about O.N.G.E.K.I.!",
    description_localizations: {
        "zh-CN": "音击小工具！",
        "zh-TW": "O.N.G.E.K.I. 小工具！",
    },
    options: [...Best50ChartCommand.getCommand()],
};
