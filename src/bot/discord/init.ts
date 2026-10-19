import { logger } from "@saltcute/logger";
import { REST, Routes } from "discord.js";
import { getConfig } from "@/bot/core/config";
import { Chuni } from "./chunithm";
import { Maimai } from "./maimai";
import { Ongeki } from "./ongeki";

import * as WhenMaint from "./whenTFAreTheyGonnaMaint";

const commands = [Maimai.getCommand(), Chuni.getCommand(), Ongeki.getCommand(), WhenMaint.getCommand()];
(async () => {
    const rest = new REST({ version: "10" }).setToken(getConfig("discord::auth.token"));

    try {
        logger.info("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(getConfig("discord::auth.clientId")), { body: commands });

        logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        logger.withError(error).error("Failed to reload application (/) commands.");
    }
})();
