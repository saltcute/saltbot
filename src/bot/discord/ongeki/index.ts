import type { Interaction } from "discord.js";
import { Best50ChartCommand } from "./b50";
import { ChartQueryCommand } from "./chart";
import { LinkUserCommand } from "./link";
import { UnlinkUserCommand } from "./unlink";

export class Ongeki {
    static readonly INTERACTION_HANDLER = async (interaction: Interaction) => {
        Best50ChartCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.CHAT_COMMAND_HANDLER(interaction);
        ChartQueryCommand.AUTOCOMPLETE_HANDLER(interaction);
        LinkUserCommand.CHAT_COMMAND_HANDLER(interaction);
        LinkUserCommand.BUTTON_HANDLER(interaction);
        UnlinkUserCommand.CHAT_COMMAND_HANDLER(interaction);
    };
    static getCommand() {
        return {
            type: 1,
            name: "geki",
            description: "Everything about O.N.G.E.K.I.!",
            descriptionLocalizations: {
                "zh-CN": "音击小工具！",
                "zh-TW": "O.N.G.E.K.I. 小工具！",
            },
            options: [
                ...Best50ChartCommand.getCommand(),
                ...LinkUserCommand.getCommand(),
                ...ChartQueryCommand.getCommand(),
                ...UnlinkUserCommand.getCommand(),
            ],
        };
    }
}
