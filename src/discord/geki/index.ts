import { Interaction } from "discord.js";
import { Best50ChartCommand } from "./b50";
import { ChartQueryCommand } from "./chart";

export class Ongeki {
    static async INTERACTION_HANDLER(interaction: Interaction) {
        Best50ChartCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.AUTOCOMPLETE_HANDLER(interaction);
    }
    static getCommand() {
        return {
            type: 1,
            name: "geki",
            description: "Everything about O.N.G.E.K.I.!",
            description_localizations: {
                "zh-CN": "音击小工具！",
                "zh-TW": "O.N.G.E.K.I. 小工具！",
            },
            options: [
                ...Best50ChartCommand.getCommand(),
                ...ChartQueryCommand.getCommand(),
            ],
        };
    }
}
