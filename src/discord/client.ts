import { Client, GatewayIntentBits } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { MaiDraw } from "maidraw";

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

client.on("ready", () => {
    kasumi.logger.info(`Logged in as ${client.user?.tag}!`);
});

client.login(kasumi.config.getSync("discord::auth.token"));
