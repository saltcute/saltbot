import { ChartQueryCommand } from "./chart";
import { Best50ChartCommand } from "./b50";
import { LinkUserCommand } from "./link";
import { Level50ChartCommand } from "./level50";
import { Interaction } from "discord.js";

export class Maimai {
    static async INTERACTION_HANDLER(interaction: Interaction) {
        Best50ChartCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.AUTOCOMPLETE_HANDLER(interaction);
        Level50ChartCommand.CHAT_COMMAND_HANDLER(interaction);
        Level50ChartCommand.BUTTON_HANDLER(interaction);
        LinkUserCommand.CHAT_COMMAND_HANDLER(interaction);
        LinkUserCommand.BUTTON_HANDLER(interaction);
    }
    static getCommand() {
        return {
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
                ...Level50ChartCommand.getCommand(),
            ],
        };
    }
}
