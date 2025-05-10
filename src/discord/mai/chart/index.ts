import upath from "upath";
import fs from "fs";
import { ApplicationCommandOption, Events } from "discord.js";
import * as fuzzySearch from "@m31coding/fuzzy-search";
import { client as kasumi } from "@/kook/init/client";
import { client } from "@/discord/client";
import { EResultTypes } from "@/util/telemetry/type";
import { Telemetry } from "@/util/telemetry";
import { Maimai } from "./type";
import _ from "lodash";

const Kuroshiro = require("kuroshiro").default;
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
const kuroshiro = new Kuroshiro();

const searcher = fuzzySearch.SearcherFactory.createDefaultSearcher<
    { id: number; name: string; nameRomaji: string },
    number
>();

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
                (v) => [v.id.toString(), v.name, v.nameRomaji]
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

                const DX_LATEST = 55, EX_LATEST = 50, CN_LATEST = 40;

                const song = interaction.options.getInteger("song", true);
                let charts = this.getChartsBySongId(song);
                if (charts == null) {
                    interaction.editReply(`No charts are found!`);
                    return EResultTypes.INVALID_INPUT;
                }
                charts = charts.sort((a, b) => a.difficulty - b.difficulty);
                const expert = charts[Maimai.EDifficulty.EXPERT] as
                    | Maimai.IChart
                    | undefined,
                    master = charts[Maimai.EDifficulty.MASTER] as
                        | Maimai.IChart
                        | undefined,
                    remaster = charts[Maimai.EDifficulty.REMASTER] as
                        | Maimai.IChart
                        | undefined;
                if (master) {
                    const EVENT_DX = master.events.filter(
                        (v) =>
                            v.version.region == "DX" &&
                            v.version.gameVersion.minor >= DX_LATEST
                    ).map(v => v.type);
                    const EVENT_EX = master.events.filter(
                        (v) =>
                            v.version.region == "EX" &&
                            v.version.gameVersion.minor >= EX_LATEST
                    ).map(v => v.type);
                    const EVENT_CN = master.events.filter(
                        (v) =>
                            v.version.region == "CN" &&
                            v.version.gameVersion.minor >= CN_LATEST
                    ).map(v => v.type);
                    const EXIST_DX = EVENT_DX.includes("existence") && !EVENT_DX.includes("removal")
                        ? "🇯🇵"
                        : "";
                    const EXIST_EX = EVENT_EX.includes("existence") && !EVENT_EX.includes("removal")
                        ? "🌏"
                        : "";
                    const EXIST_CN = EVENT_CN.includes("existence") && !EVENT_CN.includes("removal")
                        ? "🇨🇳"
                        : "";
                    const title = [master.name];
                    if(EXIST_DX)  title.push(EXIST_DX);
                    if(EXIST_EX)  title.push(EXIST_EX);
                    if(EXIST_CN)  title.push(EXIST_CN);

                    await interaction.editReply({
                        content: `Details of chart ID ${song}`,
                        embeds: [
                            {
                                title: title.join(" "),
                                description: `By **${master.artist}**
BPM: ${master.bpm}
-# Designed by
${[
                                        ...(expert ? [`-# EXP: ${expert.designer.name}`] : []),
                                        ...(master ? [`-# MAS: ${master.designer.name}`] : []),
                                        ...(remaster ? [`-# REM: ${remaster.designer.name}`] : []),
                                    ].join("\n")}`,
                                // color: 2326507,
                                fields: [
                                    {
                                        name: "Difficulty",
                                        value: `\`\`\`\n${charts
                                            .map((v) => {
                                                const events = v.events.filter(
                                                    (v) =>
                                                        v.type == "existence" &&
                                                        v.version.region == "DX"
                                                ) as Maimai.Events.Existence[];
                                                return `${(() => {
                                                    switch (v.difficulty) {
                                                        case 0:
                                                            return "Basic       ";
                                                        case 1:
                                                            return "Advanced    ";
                                                        case 2:
                                                            return "Expert      ";
                                                        case 3:
                                                            return "Master      ";
                                                        case 4:
                                                            return "Re:Master   ";
                                                        case 5:
                                                            return "UTAGE       ";
                                                    }
                                                })()}Lv${_.uniq(
                                                    events.map((v) => {
                                                        return ` ${v.data.level
                                                            .toFixed(1)
                                                            .padStart(
                                                                4,
                                                                " "
                                                            )} `;
                                                    })
                                                ).join("→")}`;
                                            })
                                            .join("\n")}\n\`\`\``,
                                        inline: false,
                                    },
                                    {
                                        name: "Notes",
                                        value: `\`\`\`
                Master${remaster ? `     Re:Master` : ""}
Tap              ${master.meta.notes.tap.toString().padStart(3, " ")}${remaster ? `           ${remaster.meta.notes.tap.toString().padStart(3, " ")}` : ""}
Hold             ${master.meta.notes.hold.toString().padStart(3, " ")}${remaster ? `           ${remaster.meta.notes.hold.toString().padStart(3, " ")}` : ""}
Slide            ${master.meta.notes.slide.toString().padStart(3, " ")}${remaster ? `           ${remaster.meta.notes.slide.toString().padStart(3, " ")}` : ""}
Touch            ${master.meta.notes.touch.toString().padStart(3, " ")}${remaster ? `           ${remaster.meta.notes.touch.toString().padStart(3, " ")}` : ""}
Break            ${master.meta.notes.break.toString().padStart(3, " ")}${remaster ? `           ${remaster.meta.notes.break.toString().padStart(3, " ")}` : ""}

Max DX Score    ${master.meta.maxDXScore.toString().padStart(4, " ")}${remaster ? `          ${remaster.meta.maxDXScore.toString().padStart(4, " ")}` : ""}
\`\`\``,
                                    },
                                    {
                                        name: "Other",
                                        value: (() => {

                                            const lines = [];
                                            const REM_DX =
                                                remaster?.events.filter(
                                                    (v) =>
                                                        v.version.region == "DX"
                                                )[0]?.version.name;
                                            const REM_EX =
                                                remaster?.events.filter(
                                                    (v) =>
                                                        v.version.region == "EX"
                                                )[0]?.version.name;
                                            const REM_CN =
                                                remaster?.events.filter(
                                                    (v) =>
                                                        v.version.region == "CN"
                                                )[0]?.version.name;
                                            const DEL_DX = master.events.find(
                                                (v) =>
                                                    v.type == "removal" &&
                                                    v.version.region == "DX"
                                            )?.version.name
                                            const DEL_EX = master.events.find(
                                                (v) =>
                                                    v.type == "removal" &&
                                                    v.version.region == "EX"
                                            )?.version.name
                                            const DEL_CN = master.events.find(
                                                (v) =>
                                                    v.type == "removal" &&
                                                    v.version.region == "CN"
                                            )?.version.name
                                            const ABS_DX =
                                                master?.events.filter(
                                                    (v) =>
                                                        v.version.region == "DX"
                                                ).pop()?.version;
                                            const ABS_EX =
                                                master?.events.filter(
                                                    (v) =>
                                                        v.version.region == "EX"
                                                ).pop()?.version;
                                            const ABS_CN =
                                                master?.events.filter(
                                                    (v) =>
                                                        v.version.region == "CN"
                                                ).pop()?.version;
                                            if (master.addVersion.DX)
                                                lines.push(
                                                    `- 🇯🇵🆕 in **${master.addVersion.DX?.name}**`
                                                );
                                            if (REM_DX)
                                                lines.push(
                                                    `- 🇯🇵👀 Re:Master in **${REM_DX}**`
                                                );
                                            if (DEL_DX)
                                                lines.push(
                                                    `- 🇯🇵❌ in **${DEL_DX}**`
                                                );
                                            else if (ABS_DX?.gameVersion.minor != DX_LATEST) {
                                                lines.push(
                                                    `- 🇯🇵❌ after **${ABS_DX?.name}**`
                                                );
                                            }
                                            if (master.addVersion.EX)
                                                lines.push(
                                                    `- 🌏🆕 in **${master.addVersion.EX?.name}**`
                                                );
                                            if (REM_EX)
                                                lines.push(
                                                    `- 🌏👀 Re:Master in **${REM_EX}**`
                                                );
                                            if (DEL_EX)
                                                lines.push(
                                                    `- 🌏❌ in **${DEL_EX}**`
                                                );
                                            else if (ABS_EX?.gameVersion.minor != EX_LATEST) {
                                                lines.push(
                                                    `- 🌏❌ after **${ABS_EX?.name}**`
                                                );
                                            }
                                            if (master.addVersion.CN)
                                                lines.push(
                                                    `- 🇨🇳🆕 in **${master.addVersion.CN?.name}**`
                                                );
                                            if (REM_CN)
                                                lines.push(
                                                    `- 🇨🇳👀 Re:Master in **${REM_CN}**`
                                                );
                                            if (DEL_CN)
                                                lines.push(
                                                    `- 🇨🇳❌ in **${DEL_CN}**`
                                                );
                                            else if (ABS_CN?.gameVersion.minor != CN_LATEST) {
                                                lines.push(
                                                    `- 🇨🇳❌ after **${ABS_CN?.name}**`
                                                );
                                            }
                                            lines.push(
                                                ...[
                                                    "-# Data from DX to PRiSM PLUS, except FESTiVAL PLUS and PRiSM.",
                                                    "-# Data of International Ver. or 舞萌DX may be unreliable.",
                                                ]
                                            );
                                            return lines.join("\n");
                                        })(),
                                    },
                                ],
                            },
                        ],
                        components: [],
                    });
                    return EResultTypes.SUCCESS;
                } else {
                    return EResultTypes.INVALID_INPUT;
                }
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
            const charts: Maimai.IChart[] = [];
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
