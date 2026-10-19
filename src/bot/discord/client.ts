import { logger } from "@saltcute/logger";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { getConfig } from "@/bot/core/config";
import { Chuni } from "./chunithm";
import { Maimai } from "./maimai";
import { Ongeki } from "./ongeki";

import * as WhenMaint from "./whenTFAreTheyGonnaMaint";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, () => {
    logger.info(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isAutocomplete() && (interaction.replied === true || interaction.deferred === true)) return;
    Maimai.INTERACTION_HANDLER(interaction);
    Chuni.INTERACTION_HANDLER(interaction);
    Ongeki.INTERACTION_HANDLER(interaction);
    WhenMaint.getCommandHandler()(interaction);
});

client.login(getConfig("discord::auth.token"));
