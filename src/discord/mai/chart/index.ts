import upath from "upath";
import fs from "fs";
import {
    ApplicationCommandOption,
    AttachmentBuilder,
    Events,
    Interaction,
} from "discord.js";
import { client as kasumi } from "@/kook/init/client";
import { client } from "@/discord/client";
import { EResultTypes } from "@/util/telemetry/type";
import { Telemetry } from "@/util/telemetry";
import { Maimai } from "./type";
import _ from "lodash";
import { MaiDraw } from "maidraw";
import axios from "axios";

// @ts-ignore
import Fuse from "fuse.js";

import { Cache } from "@/util/cache";
import TSV from "tsv";

export class ChartQueryCommand {
    static readonly DATABASE_PATH = kasumi.config.getSync(
        "maimai::config.localDatabasePath"
    );
    static readonly CHART_PATH = upath.join(
        this.DATABASE_PATH,
        "assets",
        "maimai",
        "charts"
    );

    static getChoices<T>(payload: any, choices: T[], defaults: T): T {
        if (choices.includes(payload)) return payload;
        else return defaults;
    }

    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(
        async (interaction) => {
            if (!interaction.isChatInputCommand()) return EResultTypes.IGNORED;
            if (interaction.commandName != "mai") return EResultTypes.IGNORED;
            if (interaction.options.getSubcommand() != "chart")
                return EResultTypes.IGNORED;

            await interaction.deferReply();

            const song = interaction.options.getInteger("song", true);
            const tracker = this.getChoices<
                "kamai" | "lxns" | "divingfish" | "none"
            >(
                interaction.options.getString("source", false),
                ["kamai", "lxns", "none"],
                "kamai"
            );
            const region = this.getChoices<"DX" | "EX" | "CN">(
                interaction.options.getString("region", false),
                ["DX", "EX", "CN"],
                (() => {
                    switch (tracker) {
                        case "lxns":
                            return "CN";
                        case "kamai":
                        case "none":
                        default:
                            return "DX";
                    }
                })()
            );
            let source;
            switch (tracker) {
                case "kamai":
                    source = new MaiDraw.Maimai.Best50.KamaiTachi();
                    break;
                case "lxns":
                    source = new MaiDraw.Maimai.Best50.LXNS({
                        auth: kasumi.config.getSync("maimai::lxns.token"),
                    });
                    break;
                case "none":
                    source = null;
            }
            let username = "";
            if (tracker != "none") {
                const dbUsername = await kasumi.config.getOne(
                    `salt::connection.discord.${tracker}.${interaction.user.id}`
                );
                if (dbUsername) username = dbUsername;
            }
            const chart = this.getChartsBySongId(song);
            if (chart == null) {
                await interaction.editReply({
                    content: `Failed to find a chart with ID ${song}.`,
                });
                return EResultTypes.INVALID_INPUT;
            }
            let result;
            if (source && username) {
                result = await MaiDraw.Maimai.Chart.drawWithScoreSource(
                    source,
                    username,
                    song,
                    {
                        region,
                    }
                );
            } else {
                result = await MaiDraw.Maimai.Chart.draw(
                    "maimai",
                    0,
                    song,
                    [],
                    {
                        region,
                    }
                );
            }
            if (result instanceof Buffer) {
                await interaction.editReply({
                    content: "",
                    files: [
                        new AttachmentBuilder(result, {
                            name: "result.png",
                        }),
                    ],
                });
                return EResultTypes.GENERATE_SUCCESS;
            } else {
                await interaction.editReply({
                    content: `Failed to generate a chart.`,
                });
                return EResultTypes.ERROR;
            }
        }
    );
    static async AUTOCOMPLETE_HANDLER(interaction: Interaction) {
        if (!interaction.isAutocomplete()) return;
        const focusedValue = interaction.options.getFocused();
        if (
            interaction.commandName == "mai" &&
            interaction.options.getSubcommand() == "chart"
        ) {
            if (!this.searchDatabaseLock && focusedValue) {
                const result = this.fuse
                    .search(focusedValue)
                    .filter((v) => (v.score ? v.score < 0.1 : false))
                    .map((v) => {
                        const id = parseInt(v.item.id);
                        return {
                            name:
                                v.item.name +
                                (id > 10000 && id < 100000 ? " DX" : ""),
                            value: id,
                        };
                    })
                    .slice(0, 25);
                await interaction.respond(result);
            } else await interaction.respond([]);
        }
    }

    static fuse: Fuse<{ id: string; name: string; nameRomaji: string }>;
    static searchDatabaseLock = true;
    static {
        (async () => {
            const Kuroshiro = require("kuroshiro").default;
            const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
            const kuroshiro = new Kuroshiro();

            await kuroshiro.init(new KuromojiAnalyzer());
            const songs = await Promise.all(
                ChartQueryCommand.getAllSongs()
                    .filter((v) => v.id < 100000) // Remove UTAGE
                    .map(async (v) => {
                        return {
                            id: v.id.toString(),
                            name: v.name,
                            cleanName: v.name
                                .replace(/[\p{P}\p{S}]/gu, "")
                                .replace(/  +/g, " "),
                            alias: [
                                ...(await ChartQueryCommand.OtherSongNameAlias.getAliasBySongName(
                                    v.name
                                )),
                                ...(await ChartQueryCommand.ChineseSongNameAlias.getAliasBySongId(
                                    v.id
                                )),
                            ],
                            nameRomaji: Kuroshiro.Util.isJapanese(v.name)
                                ? await kuroshiro.convert(v.name, {
                                      to: "romaji",
                                  })
                                : v.name,
                        };
                    })
            );
            this.fuse = new Fuse(songs, {
                keys: ["id", "name", "nameRomaji", "cleanName", "alias"],
                includeScore: true,
                ignoreLocation: true,
                ignoreDiacritics: true,
                useExtendedSearch: true,
                ignoreFieldNorm: true,
            });
            kasumi.logger.info(`Fuzzy search database loading finished.`);
            this.searchDatabaseLock = false;
        })();
    }

    static getChartsBySongId(id: number) {
        const targetPath = upath.join(
            this.CHART_PATH,
            `${id.toString().padStart(6, "0")}`
        );
        if (fs.existsSync(targetPath)) {
            const chartFiles = fs.readdirSync(targetPath);
            const charts: Maimai.IChart[] = [];
            for (const chart of chartFiles) {
                try {
                    charts.push(require(upath.join(targetPath, chart)));
                } catch {}
            }
            return charts;
        }
        return null;
    }

    static getAllSongs() {
        const chartFolders = fs.readdirSync(this.CHART_PATH);
        const songs: { id: number; name: string; level: number }[] = [];
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
                        {
                            type: 3,
                            name: "region",
                            nameLocalizations: {
                                "zh-CN": "地区",
                                "zh-TW": "地區",
                            },
                            description:
                                "Specify the region of the chart. (Defaults to Japan)",
                            descriptionLocalizations: {
                                "zh-CN": "选择谱面详情的地区版本。",
                                "zh-TW": "選擇譜面資料的地區版本。",
                            },
                            choices: [
                                {
                                    name: "Japan",
                                    nameLocalizations: {
                                        "zh-CN": "日服",
                                        "zh-TW": "日本",
                                    },
                                    value: "DX",
                                },
                                {
                                    name: "International",
                                    nameLocalizations: {
                                        "zh-CN": "国际服",
                                        "zh-TW": "國際",
                                    },
                                    value: "EX",
                                },
                                {
                                    name: "China",
                                    nameLocalizations: {
                                        "zh-CN": "国服",
                                        "zh-TW": "中國",
                                    },
                                    value: "CN",
                                },
                            ],
                        },
                        {
                            type: 3,
                            name: "source",
                            nameLocalizations: {
                                "zh-CN": "来源",
                                "zh-TW": "來源",
                            },
                            description:
                                "The score tracker to use for the chart. (Defaults to Kamaitachi)",
                            descriptionLocalizations: {
                                "zh-CN":
                                    "生成图片使用的查分器。（默认为 Kamaitachi）",
                                "zh-TW":
                                    "生成圖片使用的查分器。（默認為 Kamaitachi）",
                            },
                            choices: [
                                { name: "Kamaitachi", value: "kamai" },
                                {
                                    name: "LXNS",
                                    value: "lxns",
                                    nameLocalizations: {
                                        "zh-CN": "落雪查分器",
                                        "zh-TW": "LXNS",
                                    },
                                },
                                {
                                    name: "None",
                                    nameLocalizations: {
                                        "zh-CN": "无",
                                        "zh-TW": "无",
                                    },
                                    value: "none",
                                },
                            ],
                            required: false,
                        },
                    ],
                },
            ];
        } else return [];
    }
}
export namespace ChartQueryCommand {
    export const cache = new Cache();
    export class ChineseSongNameAlias {
        static readonly ENDPOINT =
            "https://www.yuzuchan.moe/api/maimaidx/maimaidxalias";
        private static async get(endpoint: string, data?: any, options?: any) {
            const cached = await ChartQueryCommand.cache.get(endpoint);
            if (cached) {
                return cached;
            }
            const response = await axios
                .get(endpoint, { ...options, data, timeout: 2000 })
                .catch(() => null);
            if (!response) {
                return null;
            }
            await ChartQueryCommand.cache.put(
                endpoint,
                response.data,
                1000 * 60 * 60
            );
            return response.data;
        }
        static async getAllAlias() {
            const res = await this.get(this.ENDPOINT);
            if (!res) return [];
            const contents: {
                SongID: number;
                Name: string;
                Alias: string[];
            }[] = res.content;
            return contents;
        }
        static async getAliasBySongId(id: number) {
            const alias = await this.getAllAlias();
            const song = alias.find((v) => v.SongID == id);
            if (song) {
                return song.Alias;
            }
            return [];
        }
    }
    export class OtherSongNameAlias {
        private static readonly CACHE_KEY = "GCMBOT_ALIAS";
        static path = upath.join(__dirname, "GCM-bot", "data", "aliases");
        static async getAllAlias() {
            const cached = await ChartQueryCommand.cache.get(this.CACHE_KEY);
            if (cached) return cached;
            const contents: { [k: string]: string[] } = {};
            for (const locale of ["en", "ko", "ja"]) {
                if (
                    fs.existsSync(upath.join(this.path, locale, "maimai.tsv"))
                ) {
                    const tsv = fs.readFileSync(
                        upath.join(this.path, locale, "maimai.tsv"),
                        { encoding: "utf8" }
                    );
                    const records: string[][] = new TSV.Parser("\t", {
                        header: false,
                    }).parse(tsv);
                    records.forEach((record) => {
                        const id = record.shift();
                        if (id) {
                            if (!contents[id]) contents[id] = [];
                            contents[id].push(...record);
                        }
                    });
                }
            }
            ChartQueryCommand.cache.put(
                this.CACHE_KEY,
                contents,
                1000 * 60 * 60
            );
            return contents;
        }
        static async getAliasBySongName(name: string) {
            return (await this.getAllAlias())[name] || [];
        }
    }
}
