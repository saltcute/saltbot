import upath from "upath";
import fs from "fs";
import { ApplicationCommandOption, Events } from "discord.js";
import * as fuzzySearch from "@m31coding/fuzzy-search";
import { client } from "@/discord/client";
import { EResultTypes } from "@/util/telemetry/type";
import { Telemetry } from "@/util/telemetry";

const Kuroshiro = require("kuroshiro").default;
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
const kuroshiro = new Kuroshiro();

const searcher = fuzzySearch.SearcherFactory.createDefaultSearcher<
    { id: number; name: string; nameRomaji: string },
    number
>();

interface Chart {
    id: number;
    name: string;
    level: number;
    difficulty: number;
}

export class ChartQueryCommand {
    static readonly DATABASE_PATH = upath.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "..",
        "maimai-songs-database"
    );
    static readonly CHART_PATH = upath.join(
        this.DATABASE_PATH,
        "assets",
        "maimai",
        "charts"
    );

    static {
        kuroshiro.init(new KuromojiAnalyzer()).then(async () => {
            const songs = await Promise.all(
                this.getAllSongs().map(async (v) => {
                    return {
                        id: v.id,
                        name: v.name,
                        nameRomaji: Kuroshiro.Util.isJapanese(v.name)
                            ? await kuroshiro.convert(v.name, { to: "romaji" })
                            : v.name,
                    };
                })
            );
            searcher.indexEntities(
                songs,
                (v) => v.id,
                (v) => [v.name, v.nameRomaji]
            );
        });
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isAutocomplete()) return;
            const focusedValue = interaction.options.getFocused();
            if (
                interaction.commandName == "mai" &&
                interaction.options.getSubcommand() == "chart"
            ) {
                if (focusedValue)
                    interaction.respond(
                        searcher
                            .getMatches(new fuzzySearch.Query(focusedValue))
                            .matches.map((v) => {
                                return {
                                    name:
                                        v.entity.name +
                                        (v.entity.id > 10000 &&
                                        v.entity.id < 100000
                                            ? " DX"
                                            : ""),
                                    value: v.entity.id,
                                };
                            })
                    );
                else interaction.respond([]);
            }
        });
        client.on(
            Events.InteractionCreate,
            Telemetry.discordMiddleware(async (interaction) => {
                if (!interaction.isChatInputCommand())
                    return EResultTypes.IGNORED;
                if (interaction.commandName != "mai")
                    return EResultTypes.IGNORED;
                if (interaction.options.getSubcommand() != "chart")
                    return EResultTypes.IGNORED;

                await interaction.deferReply();
    
                const song = interaction.options.getInteger("song", true)
                let charts = this.getChartsBySongId(song);
                if(charts == null) {
                    interaction.editReply(`No charts are found!`);
                    return EResultTypes.INVALID_INPUT;
                }
                charts = charts.sort(
                    (a, b) => a.difficulty - b.difficulty
                );
                await interaction.editReply(
                    `**${charts[0].name}**\n\n${charts
                        .map((v) => {
                            return `${(() => {
                                switch (v.difficulty) {
                                    case 0:
                                        return "Basic";
                                    case 1:
                                        return "Advanced";
                                    case 2:
                                        return "Expert";
                                    case 3:
                                        return "Master";
                                    case 4:
                                        return "Re:Master";
                                    case 5:
                                        return "UTAGE";
                                }
                            })()} Lv ${v.level}`;
                        })
                        .join("\n")}`
                );
                return EResultTypes.SUCCESS;
            })
        );
    }

    static getChartsBySongId(id: number) {
        const targetPath = upath.join(
            this.CHART_PATH,
            `${id.toString().padStart(6, "0")}`
        );
        if (fs.existsSync(targetPath)) {
            const chartFiles = fs.readdirSync(targetPath);
            const charts: Chart[] = [];
            for (const chart of chartFiles) {
                charts.push(require(upath.join(targetPath, chart)));
            }
            return charts;
        }
        return null;
    }

    static getAllSongs() {
        const chartFolders = fs.readdirSync(this.CHART_PATH);
        const songs: { id: number; name: string; level: 5 }[] = [];
        for (const folder of chartFolders) {
            for (let i = 0; i <= 5; ++i) {
                if (
                    fs.existsSync(
                        upath.join(this.CHART_PATH, folder, `${i}.json`)
                    )
                ) {
                    songs.push(
                        require(
                            upath.join(this.CHART_PATH, folder, `${i}.json`)
                        )
                    );
                    break;
                }
            }
        }
        return songs;
    }

    static getCommand(): ApplicationCommandOption[] {
        if (fs.existsSync(this.DATABASE_PATH)) {
            return [
                {
                    type: 1,
                    name: "chart",
                    description: "Check the details of a chart.",
                    descriptionLocalizations: {
                        "zh-CN": "查看谱面详情。",
                        "zh-TW": "檢視譜面資料。",
                    },
                    options: [
                        {
                            type: 4,
                            name: "song",
                            nameLocalizations: {
                                "zh-CN": "歌曲",
                                "zh-TW": "歌曲",
                            },
                            description:
                                "The name of the song you are looking for.",
                            descriptionLocalizations: {
                                "zh-CN": "你想要搜索的歌名。",
                                "zh-TW": "您想要搜尋的歌名。",
                            },
                            required: true,
                            autocomplete: true,
                        },
                    ],
                },
            ];
        } else return [];
    }
}
