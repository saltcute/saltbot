import type { CacheType, Interaction } from "discord.js";
import { type Collection, MongoClient } from "mongodb";
import { client as kasumi } from "@/bot/kook/init/client";
import { ResultTypes } from "./type";

export class Telemetry {
    private static isReady = false;
    private static mongodb: MongoClient;
    private static collection: Collection;
    static {
        kasumi.on("connect.*", async () => {
            const mongodbUri = kasumi.config.getSync("kasumi::config.mongoConnectionString");
            const mongodbDatabase = kasumi.config.getSync("kasumi::config.mongoDatabaseName");
            if (mongodbUri) {
                Telemetry.mongodb = new MongoClient(mongodbUri);
                Telemetry.mongodb.on("error", () => {
                    console.error("Telemetry initialization failed");
                });
                await Telemetry.mongodb.connect();
                Telemetry.collection = await Telemetry.mongodb.db(mongodbDatabase).collection("usage");
            }
            Telemetry.isReady = true;
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
        if (!Telemetry.isReady) return false;
        Telemetry.collection.insertOne({ ...content, time: new Date() });
        return true;
    }
    public static discordMiddleware(handler: (interaction: Interaction<CacheType>) => Promise<ResultTypes> | ResultTypes) {
        return async (interaction: Interaction<CacheType>) => {
            try {
                if (interaction.isCommand()) {
                    const returnValue = handler(interaction);
                    if (returnValue instanceof Promise) {
                        returnValue.catch(kasumi.logger.error);
                    }
                    const result = await returnValue;
                    if (result === ResultTypes.IGNORED) return;
                    else
                        Telemetry.logCommandUsage({
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
                                    const subCommandGroup = interaction.options.getSubcommandGroup(false);
                                    const subCommand = interaction.options.getSubcommand(false);
                                    if (subCommandGroup) commands.push(subCommandGroup);
                                    if (subCommand) commands.push(subCommand);
                                }
                                return commands;
                            })(),
                            args: interaction.isChatInputCommand()
                                ? interaction.options.data.map((option) => {
                                      // biome-ignore lint/suspicious/noExplicitAny: complicated type
                                      const mapOption = (opt: typeof option): any => {
                                          // biome-ignore lint/suspicious/noExplicitAny: complicated type
                                          const { name, value, options } = opt as any;
                                          if (options && Array.isArray(options) && options.length > 0) {
                                              return {
                                                  name,
                                                  options: options.map(mapOption),
                                              };
                                          } else {
                                              return {
                                                  name,
                                                  value: value?.toString(),
                                              };
                                          }
                                      };
                                      return mapOption(option);
                                  })
                                : [],
                            result,
                        });
                } else handler(interaction);
            } catch (e) {
                kasumi.logger.error(e);
            }
        };
    }
}
