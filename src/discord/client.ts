import { Client, GatewayIntentBits } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { MaiDraw } from "maidraw";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

export const maidraw = new MaiDraw(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);

client.on("ready", () => {
    kasumi.logger.info(`Logged in as ${client.user?.tag}!`);
});

client.login(kasumi.config.getSync("discord::auth.token"));
