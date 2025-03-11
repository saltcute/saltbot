import { AttachmentBuilder, Client, GatewayIntentBits } from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { DivingFish, KamaiTachi, LXNS, MaiDraw } from "maidraw";
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const maidraw = new MaiDraw(
    kasumi.config.getSync("maimai::config.useLocalDatabase")
        ? kasumi.config.getSync("maimai::config.localDatabasePath")
        : ""
);

const lxns = new LXNS(maidraw, kasumi.config.getSync("maimai::lxns.token"));
const kamai = new KamaiTachi(maidraw);
const divingfish = new DivingFish(maidraw);

client.on("ready", () => {
    kasumi.logger.info(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "mai") {
        let result: Buffer | null = null;
        const version =
            interaction.options.getString("version", false) || "jp-buddiesplus";
        const theme =
            interaction.options.getString("theme", false) ||
            (version ? `${version}-landscape` : "jp-buddiesplus-landscape");
        interaction.deferReply();
        switch (interaction.options.getSubcommand()) {
            case "kamai": {
                const username = interaction.options.getString("userid", true);
                switch (version) {
                    case "jp-buddies":
                        result = await maidraw.drawWithScoreSource(
                            kamai.buddies(),
                            username,
                            {
                                theme,
                            }
                        );
                        break;
                    case "jp-buddiesplus":
                        result = await maidraw.drawWithScoreSource(
                            kamai.buddiesplus(),
                            username,
                            {
                                theme,
                            }
                        );
                        break;
                    case "jp-prism":
                        result = await maidraw.drawWithScoreSource(
                            kamai.prism(),
                            username,
                            {
                                theme,
                            }
                        );
                        break;
                    default:
                        result = await maidraw.drawWithScoreSource(
                            kamai,
                            username,
                            {
                                theme,
                            }
                        );
                        break;
                }
                break;
            }
            case "divingfish": {
                const username = interaction.options.getString(
                    "username",
                    true
                );
                result = await maidraw.drawWithScoreSource(
                    divingfish,
                    username,
                    {
                        theme,
                    }
                );
                break;
            }
            case "lxns": {
                const username = interaction.options.getString(
                    "friendcode",
                    true
                );
                result = await maidraw.drawWithScoreSource(lxns, username, {
                    theme,
                });
                break;
            }
        }
        if (!result) {
            interaction.editReply({
                content: "Failed to generate a chart. Please check your input.",
            });
        } else {
            interaction.editReply({
                content: "",
                files: [
                    new AttachmentBuilder(result, {
                        name: "result.png",
                    }),
                ],
            });
        }
    }
});

client.login(kasumi.config.getSync("discord::auth.token"));
