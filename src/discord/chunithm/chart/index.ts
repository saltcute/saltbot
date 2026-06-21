import fs from "node:fs";
import { Cache } from "@saltcute/cache";
import { Util } from "@util/index";
import { Telemetry } from "@util/telemetry";
import { ResultTypes } from "@util/telemetry/type";
import axios from "axios";
import { type ApplicationCommandOption, ApplicationCommandOptionType, AttachmentBuilder, type Interaction } from "discord.js";
import Fuse from "fuse.js";
import { Difficulty } from "gcm-database/chunithm";
import type { Chart } from "gcm-database-local/chunithm";
import type { DataOrError } from "maidraw";
import { ChartPainter, type ChunithmScoreAdapter } from "maidraw/chunithm";
import { KamaiTachiScoreAdapter } from "maidraw-kamai-tachi-adapter/chunithm";
import { LxnsScoreAdapter } from "maidraw-lxns-adapter/chunithm";
import TSV from "tsv";
import upath from "upath";
import { client as kasumi } from "@/kook/init/client";
import { database } from "../database";

const painter = new ChartPainter(database);

export class ChartQueryCommand {
    static readonly DATABASE_PATH = kasumi.config.getSync("maimai::config.localDatabasePath");
    static readonly CHART_PATH = upath.join(this.DATABASE_PATH, "assets", "chunithm", "charts");
    private static readonly DEFAULT_RATING_ALOGRITHM = "new";

    static getChoices<T>(payload: unknown, choices: T[], defaults: T): T {
        if (choices.includes(payload as T)) return payload as T;
        else return defaults;
    }

    static readonly DEFAULT_THEME = "jp-xversex";
    static readonly CHAT_COMMAND_HANDLER = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== "chu") return ResultTypes.IGNORED;
        if (interaction.options.getSubcommand() !== "chart") return ResultTypes.IGNORED;

        await interaction.deferReply();

        const song = interaction.options.getInteger("song", true);
        const tracker = this.getChoices<"kamai" | "lxns-chuni" | "divingfish" | "none">(
            interaction.options.getString("source", false),
            ["kamai", "lxns-chuni", "none"],
            "kamai",
        );
        const type = this.getChoices<"new" | "recents">(
            interaction.options.getString("type", false),
            ["new", "recents"],
            this.DEFAULT_RATING_ALOGRITHM,
        );
        const theme = interaction.options.getString("theme", false) || this.DEFAULT_THEME;
        // const region = this.getChoices<"DX" | "EX" | "CN">(
        //     interaction.options.getString("region", false),
        //     ["DX", "EX", "CN"],
        //     (() => {
        //         switch (tracker) {
        //             case "lxns-chuni":
        //                 return "CN";
        //             case "kamai":
        //             case "none":
        //             default:
        //                 return "DX";
        //         }
        //     })()
        // );
        let source: ChunithmScoreAdapter | null;
        switch (tracker) {
            case "kamai":
                source = new KamaiTachiScoreAdapter({ database });
                break;
            case "lxns-chuni":
                source = new LxnsScoreAdapter({
                    auth: kasumi.config.getSync("maimai::lxns.token"),
                    database,
                });
                break;
            default:
                source = null;
        }
        let username = "";
        if (tracker !== "none") {
            const dbUsername = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${interaction.user.id}`);
            if (dbUsername) username = dbUsername;
        }
        const chart = this.getChartsBySongId(song);
        if (chart == null) {
            await interaction.editReply({
                content: `Failed to find a chart with ID ${song}.`,
            });
            return ResultTypes.INVALID_INPUT;
        }
        let result: DataOrError<Buffer>;
        if (source && username) {
            result = await painter.drawWithScoreSource(
                source,
                {
                    username,
                    chartIdentifier: song.toString(),
                    type,
                },
                { theme },
            );
        } else {
            result = await painter.draw(
                {
                    username: "CHUNITHM",
                    rating: 0,
                    chartIdentifier: song.toString(),
                    scores: Object.fromEntries(Object.values(Difficulty).map((v) => [v, null])) as Record<Difficulty, null>,
                    type,
                },
                { theme },
            );
        }
        if (result.err) {
            await Util.reportError(interaction, result.err);
            return ResultTypes.TRACKER_BAD_RESPONSE;
        } else {
            await interaction.editReply({
                content: "",
                files: [
                    new AttachmentBuilder(result.data, {
                        name: "result.png",
                    }),
                ],
            });
            return ResultTypes.GENERATE_SUCCESS;
        }
    });
    static readonly AUTOCOMPLETE_HANDLER = async (interaction: Interaction) => {
        if (!interaction.isAutocomplete()) return;
        const focusedValue = interaction.options.getFocused();
        if (interaction.commandName === "chu" && interaction.options.getSubcommand() === "chart") {
            if (!ChartQueryCommand.searchDatabaseLock && focusedValue) {
                const result = ChartQueryCommand.fuse
                    .search(focusedValue)
                    .filter((v) => (v.score ? v.score < 0.1 : false))
                    .map((v) => {
                        const id = parseInt(v.item.id, 10);
                        return {
                            name: `${v.item.name.length > 50 ? `${v.item.name.slice(0, 50)}...` : v.item.name}${v.matches?.[0].value && v.matches[0].key?.toLowerCase().includes("alias") ? `　|「${v.matches[0].value}」` : ""}`,
                            value: id,
                        };
                    })
                    .slice(0, 25);
                await interaction.respond(result);
            } else await interaction.respond([]);
        }
    };

    static fuse: Fuse<{
        id: string;
        name: string;
        nameRomaji: string;
        cleanName: string;
        alias: string[];
    }>;
    static searchDatabaseLock = true;
    static {
        (async () => {
            const Kuroshiro = require("kuroshiro").default;
            const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
            const kuroshiro = new Kuroshiro();

            await kuroshiro.init(new KuromojiAnalyzer());
            const loadAliases = async () =>
                Promise.all([ChartQueryCommand.OtherSongNameAlias.getAllAlias(), ChartQueryCommand.ChineseSongNameAlias.getAllAlias()]);
            const [otherAlias, cnAlias] = await loadAliases();
            const cnAliasById = new Map(cnAlias.map((v) => [v.song_id, v.aliases]));
            const songs = await Promise.all(
                ChartQueryCommand.getAllSongs().map(async (v) => {
                    return {
                        id: v.identifier.toString(),
                        name: v.title,
                        cleanName: v.title.replace(/[\p{P}\p{S}]/gu, "").replace(/ {2,}/g, " "),
                        alias: [...(otherAlias[v.title] || []), ...(cnAliasById.get(parseInt(v.identifier, 10)) || [])],
                        nameRomaji: Kuroshiro.Util.isJapanese(v.title)
                            ? await kuroshiro.convert(v.title, {
                                  to: "romaji",
                              })
                            : v.title,
                    };
                }),
            );
            ChartQueryCommand.fuse = new Fuse(songs, {
                keys: ["id", "name", "nameRomaji", "cleanName", "alias"],
                includeScore: true,
                ignoreLocation: true,
                ignoreDiacritics: true,
                useExtendedSearch: true,
                ignoreFieldNorm: true,
                includeMatches: true,
            });
            kasumi.logger.info(`[CHUNITHM] Fuzzy search database loading finished.`);
            ChartQueryCommand.searchDatabaseLock = false;
        })();
    }

    static getChartsBySongId(id: number) {
        const targetPath = upath.join(ChartQueryCommand.CHART_PATH, `${id.toString().padStart(4, "0")}`);
        if (fs.existsSync(targetPath)) {
            const chartFiles = fs.readdirSync(targetPath);
            const charts: Chart[] = [];
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
        const chartFolders = fs.readdirSync(ChartQueryCommand.CHART_PATH);
        const songs: Chart[] = [];
        for (const folder of chartFolders) {
            for (const difficulty of Object.values(Difficulty)) {
                if (fs.existsSync(upath.join(ChartQueryCommand.CHART_PATH, folder, `${difficulty}.json`))) {
                    songs.push(require(upath.join(ChartQueryCommand.CHART_PATH, folder, `${difficulty}.json`)));
                    break;
                }
            }
        }
        return songs;
    }

    static readonly types = [
        {
            name: "Best 50 (New 20 + Old 30)",
            nameLocalizations: { "zh-CN": "B50（b20 + b30）" },
            value: "new",
        },
        {
            name: "Best 40 (Recent 10 + Best 30)",
            nameLocalizations: { "zh-CN": "B50（r10 + b30）" },
            value: "recents",
        },
    ];

    static readonly themes = [
        {
            name: "CHUNITHM X-VERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM X-VERSE（日服）",
                "zh-TW": "CHUNITHM X-VERSE（日本）",
            },
            value: "jp-xverse",
        },
        {
            name: "CHUNITHM VERSE (Japan)",
            nameLocalizations: {
                "zh-CN": "CHUNITHM VERSE（日服）",
                "zh-TW": "CHUNITHM VERSE（日本）",
            },
            value: "jp-verse",
        },
    ];

    static getCommand(): ApplicationCommandOption[] {
        if (fs.existsSync(ChartQueryCommand.DATABASE_PATH)) {
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
                            description: "The name of the song you are looking for. (Including English names and aliases)",
                            descriptionLocalizations: {
                                "zh-CN": "你想要搜索的歌名。（支持中文别名）",
                                "zh-TW": "您想要搜尋的歌名。",
                            },
                            required: true,
                            autocomplete: true,
                        },
                        // {
                        //     type: 3,
                        //     name: "region",
                        //     nameLocalizations: {
                        //         "zh-CN": "地区",
                        //         "zh-TW": "地區",
                        //     },
                        //     description:
                        //         "Specify the region of the chart. (Defaults to Japan)",
                        //     descriptionLocalizations: {
                        //         "zh-CN": "选择谱面详情的地区版本。",
                        //         "zh-TW": "選擇譜面資料的地區版本。",
                        //     },
                        //     choices: [
                        //         {
                        //             name: "Japan",
                        //             nameLocalizations: {
                        //                 "zh-CN": "日服",
                        //                 "zh-TW": "日本",
                        //             },
                        //             value: "DX",
                        //         },
                        //         {
                        //             name: "International",
                        //             nameLocalizations: {
                        //                 "zh-CN": "国际服",
                        //                 "zh-TW": "國際",
                        //             },
                        //             value: "EX",
                        //         },
                        //         {
                        //             name: "China",
                        //             nameLocalizations: {
                        //                 "zh-CN": "国服",
                        //                 "zh-TW": "中國",
                        //             },
                        //             value: "CN",
                        //         },
                        //     ],
                        // },

                        {
                            type: ApplicationCommandOptionType.String,
                            name: "type",
                            nameLocalizations: {
                                "zh-CN": "模式",
                                "zh-TW": "模式",
                            },
                            description: "Choose between generating Best 40 (recents 10) or Best 50 (new 20).",
                            descriptionLocalizations: {
                                "zh-CN": "选择生成 b40 (r10 + b30) 或是 b50 (b20 + b30)。",
                                "zh-TW": "選擇生成 Best 40 (recents 10) 或是 Best 50 (new 20)。",
                            },
                            choices: ChartQueryCommand.types,
                        },
                        {
                            type: 3,
                            name: "source",
                            nameLocalizations: {
                                "zh-CN": "来源",
                                "zh-TW": "來源",
                            },
                            description: "The score tracker to use for the chart. (Defaults to Kamaitachi)",
                            descriptionLocalizations: {
                                "zh-CN": "生成图片使用的查分器。（默认为 Kamaitachi）",
                                "zh-TW": "生成圖片使用的查分器。（默認為 Kamaitachi）",
                            },
                            choices: [
                                { name: "Kamaitachi", value: "kamai" },
                                {
                                    name: "LXNS",
                                    value: "lxns-chuni",
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
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "theme",
                            nameLocalizations: {
                                "zh-CN": "主题",
                                "zh-TW": "主題",
                            },
                            description: "Choose from a variety of themes for your Best 50 chart.",
                            descriptionLocalizations: {
                                "zh-CN": "选择 b50 图片的主题。",
                                "zh-TW": "選擇 Best 50 圖像的主題。",
                            },
                            choices: ChartQueryCommand.themes,
                        },
                    ],
                },
            ];
        } else return [];
    }
}
export namespace ChartQueryCommand {
    export const cache = new Cache("saltbot/chunithm/chart");
    export class ChineseSongNameAlias {
        static readonly ENDPOINT = "https://maimai.lxns.net/api/v0/chunithm/alias/list";
        private static async get(endpoint: string, data?: unknown, options?: object) {
            const cached = await ChartQueryCommand.cache.get(endpoint);
            if (cached) {
                return cached;
            }
            const response = await axios.get(endpoint, { ...options, data, timeout: 30 * 1000 }).catch(() => null);
            if (!response) {
                return null;
            }
            await ChartQueryCommand.cache.put(endpoint, response.data, 24 * 60 * 60 * 1000);
            return response.data;
        }
        static async getAllAlias() {
            const res = await ChineseSongNameAlias.get(ChineseSongNameAlias.ENDPOINT);
            if (!res) return [];
            const contents: {
                // biome-ignore lint/style/useNamingConvention: LXNS API naming
                song_id: number;
                aliases: string[];
            }[] = res.aliases;
            return contents;
        }
    }
    export class OtherSongNameAlias {
        private static readonly CACHE_KEY = "GCMBOT_ALIAS_CHUNI";
        static path = upath.join(__dirname, "..", "..", "mai", "chart", "GCM-bot", "data", "aliases");
        static async getAllAlias() {
            const cached = await ChartQueryCommand.cache.get(OtherSongNameAlias.CACHE_KEY);
            if (cached) return cached;
            const contents: { [k: string]: string[] } = {};
            for (const locale of ["en", "ko", "ja"]) {
                if (fs.existsSync(upath.join(OtherSongNameAlias.path, locale, "chuni.tsv"))) {
                    const tsv = fs.readFileSync(upath.join(OtherSongNameAlias.path, locale, "chuni.tsv"), { encoding: "utf8" });
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
            await ChartQueryCommand.cache.put(OtherSongNameAlias.CACHE_KEY, contents, 24 * 60 * 60 * 1000);
            return contents;
        }
    }
}
