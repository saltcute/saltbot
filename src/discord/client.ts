import { Client, Events, GatewayIntentBits } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { MaiDraw } from "maidraw";
import { Maimai } from "./mai";
import { Chuni } from "./chu";
import { Ongeki } from "./geki";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

MaiDraw.Maimai.Database.setLocalDatabasePath(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);
MaiDraw.Chuni.Database.setLocalDatabasePath(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);
MaiDraw.Geki.Database.setLocalDatabasePath(
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
    Chuni.INTERACTION_HANDLER(interaction);
    Ongeki.INTERACTION_HANDLER(interaction);
});
