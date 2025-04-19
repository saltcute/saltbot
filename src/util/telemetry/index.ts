import { client as kasumi } from "@/kook/init/client";
import { CacheType, Interaction } from "discord.js";
import { Collection, MongoClient, MongoDBCollectionNamespace } from "mongodb";
import { EResultTypes } from "./type";

export class Telemetry {
    private static isReady = false;
    private static mongodb: MongoClient;
    private static collection: Collection;
    static {
        kasumi.on("connect.*", async () => {
            const mongodbURI = kasumi.config.getSync(
                "kasumi::config.mongoConnectionString"
            );
            const mongodbDatabase = kasumi.config.getSync(
                "kasumi::config.mongoDatabaseName"
            );
            if (mongodbURI) {
                this.mongodb = new MongoClient(mongodbURI);
                this.mongodb.on("error", () => {
                    console.error("Telemetry initialization failed");
                });
                await this.mongodb.connect();
                this.collection = await this.mongodb
                    .db(mongodbDatabase)
                    .collection("usage");
            }
            this.isReady = true;
        });
    }
    public static logCommandUsage(content: {
        source: "kook" | "discord";
        user: { name: string; id: string };
        place: { guildId: string; channelId: string };
        command: string[];
        args: Record<string, string>[];
        result: string;
    }): boolean {
        if (!this.isReady) return false;
        this.collection.insertOne({ ...content, time: new Date() });
        return true;
    }
    public static discordMiddleware(
        handler: (
            interaction: Interaction<CacheType>
        ) => Promise<EResultTypes> | EResultTypes
    ) {
        return async (interaction: Interaction<CacheType>) => {
            if (interaction.isCommand()) {
                const result = await handler(interaction);
                if (result == EResultTypes.IGNORED) return;
                else
                    this.logCommandUsage({
                        source: "discord",
                        user: {
                            name: interaction.user.username,
                            id: interaction.user.id,
                        },
                        place: {
                            guildId: interaction.guildId || "",
                            channelId: interaction.channelId || "",
                        },
                        command: (() => {
                            const commands = [interaction.commandName];
                            if (interaction.isChatInputCommand()) {
                                const subCommandGroup =
                                    interaction.options.getSubcommandGroup(
                                        false
                                    );
                                const subCommand =
                                    interaction.options.getSubcommand(false);
                                if (subCommandGroup)
                                    commands.push(subCommandGroup);
                                if (subCommand) commands.push(subCommand);
                            }
                            return commands;
                        })(),
                        args: interaction.options.data.map((v) => ({
                            name: v.name,
                            value: v.value?.toString() || "",
                        })),
                        result,
                    });
            } else handler(interaction);
        };
    }
}
