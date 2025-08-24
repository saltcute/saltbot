import { client } from "@/kook/init/client";
import { REST, Routes } from "discord.js";
import { gekiCommand } from "./geki";
import { Maimai } from "./mai";
import { Chuni } from "./chu";

const commands = [Maimai.getCommand(), Chuni.getCommand(), gekiCommand];
(async () => {
    const rest = new REST({ version: "10" }).setToken(
        client.config.getSync("discord::auth.token")
    );

    try {
        client.logger.info("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationCommands(
                client.config.getSync("discord::auth.clientId")
            ),
            { body: commands }
        );

        client.logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        client.logger.error(error);
    }
})();
