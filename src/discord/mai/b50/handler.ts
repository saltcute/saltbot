import { client, maidraw } from "@/discord/client";
import { AttachmentBuilder, Events } from "discord.js";
import { LXNS, KamaiTachi, DivingFish } from "maidraw";
import { client as kasumi } from "@/kook/init/client";

const lxns = new LXNS(maidraw, kasumi.config.getSync("maimai::lxns.token"));
const kamai = new KamaiTachi(maidraw);
const divingfish = new DivingFish(maidraw);

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandId === "mai" && interaction.options.getSubcommandGroup() == "b50") {
        let result: Buffer | null = null;
        const version =
            interaction.options.getString("version", false) || "jp-prism";
        const theme =
            interaction.options.getString("theme", false) ||
            (version ? `${version}-landscape` : "jp-prism-landscape");
        await interaction.deferReply();
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