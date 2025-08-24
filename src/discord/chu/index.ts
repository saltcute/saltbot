import { Interaction } from "discord.js";
import { Best50ChartCommand } from "./b50";
import { ChartQueryCommand } from "./chart";
import { LinkUserCommand } from "./link";

export class Chuni {
    static async INTERACTION_HANDLER(interaction: Interaction) {
        Best50ChartCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.AUTOCOMPLETE_HANDLER(interaction);
        LinkUserCommand.CHAT_COMMAND_HANDLER(interaction);
        LinkUserCommand.BUTTON_HANDLER(interaction);
    }
    static getCommand() {
        return {
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
                ...ChartQueryCommand.getCommand(),
            ],
        };
    }
}
