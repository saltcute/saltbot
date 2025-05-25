import { Client, Events, GatewayIntentBits } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { MaiDraw } from "maidraw";
import { Maimai } from "./mai";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

MaiDraw.Maimai.Chart.Database.setLocalDatabasePath(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);
MaiDraw.Chuni.Chart.Database.setLocalDatabasePath(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);
MaiDraw.Geki.Chart.Database.setLocalDatabasePath(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);

client.on(Events.ClientReady, () => {
    kasumi.logger.info(`Logged in as ${client.user?.tag}!`);
});

client.login(kasumi.config.getSync("discord::auth.token"));

client.on(Events.InteractionCreate, async (interaction) => {
    if (
        !interaction.isAutocomplete() &&
        (interaction.replied === true || interaction.deferred === true)
    )
        return;
    Maimai.INTERACTION_HANDLER(interaction);
});
