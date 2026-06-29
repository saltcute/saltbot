import { REST, Routes } from "discord.js";
import { client } from "@/bot/kook/init/client";
import { Chuni } from "./chunithm";
import { Maimai } from "./maimai";
import { Ongeki } from "./ongeki";

const commands = [Maimai.getCommand(), Chuni.getCommand(), Ongeki.getCommand()];
(async () => {
    const rest = new REST({ version: "10" }).setToken(client.config.getSync("discord::auth.token"));

    try {
        client.logger.info("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(client.config.getSync("discord::auth.clientId")), { body: commands });

        client.logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        client.logger.error(error);
    }
})();
