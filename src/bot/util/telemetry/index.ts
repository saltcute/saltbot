import { logger } from "@saltcute/logger";
import type { CacheType, Interaction } from "discord.js";
import { getDatabase } from "@/bot/core/database";
import { ResultTypes } from "./type";

export class Telemetry {
    public static logCommandUsage(content: {
        source: "discord";
        user: { name: string; id: string };
        place: { guildId: string; channelId: string };
        command: string[];
        args: Record<string, string>[];
        result: string;
    }): void {
        getDatabase()
            .collection("usage")
            .insertOne({ ...content, time: new Date() })
            .catch((e) => logger.withError(e).error("Failed to log command usage"));
    }
    public static discordMiddleware(handler: (interaction: Interaction<CacheType>) => Promise<ResultTypes> | ResultTypes) {
        return async (interaction: Interaction<CacheType>) => {
            try {
                if (interaction.isCommand()) {
                    const result = await handler(interaction);
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
                } else await handler(interaction);
            } catch (e) {
                logger.errorOnly(e);
            }
        };
    }
}
