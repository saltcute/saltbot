import { Client, Events, GatewayIntentBits } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { Chuni } from "./chunithm";
import { Maimai } from "./maimai";
import { Ongeki } from "./ongeki";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, () => {
    kasumi.logger.info(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isAutocomplete() && (interaction.replied === true || interaction.deferred === true)) return;
    Maimai.INTERACTION_HANDLER(interaction);
    Chuni.INTERACTION_HANDLER(interaction);
    Ongeki.INTERACTION_HANDLER(interaction);
});

client.login(kasumi.config.getSync("discord::auth.token"));
