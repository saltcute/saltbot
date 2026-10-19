import { Difficulty, type Type } from "gcm-database/maimai";
import { GOALS, type GoalKey } from "./goals";
import type { ChartRef, FolderDefinition, FolderEntry, Region, SongRef } from "./types";

const DIFFICULTIES = [Difficulty.BASIC, Difficulty.ADVANCED, Difficulty.EXPERT, Difficulty.MASTER, Difficulty.RE_MASTER];

/**
 * Displayed level of an internal level, e.g. `14.6` → `"14+"`. Levels below 7 have no plus.
 */
export function getDisplayLevel(level: number): string {
    const tenths = Math.round(level * 10);
    const base = Math.floor(tenths / 10);
    return base >= 7 && tenths % 10 >= 6 ? `${base}+` : `${base}`;
}

/**
 * Split charts into one folder per displayed level, from the lowest level to the highest.
 * Charts keep their order within a folder.
 */
export function byLevel(charts: ChartRef[], options?: Omit<FolderEntry, "title" | "charts">): FolderEntry[] {
    const groups = new Map<string, { order: number; charts: ChartRef[] }>();
    for (const chart of charts) {
        const level = getDisplayLevel(chart.level);
        const order = Number.parseInt(level, 10) + (level.endsWith("+") ? 0.5 : 0);
        const group = groups.get(level) ?? { order, charts: [] };
        group.charts.push(chart);
        groups.set(level, group);
    }
    return [...groups.entries()]
        .sort(([, a], [, b]) => b.order - a.order)
        .map(([level, group]) => ({ ...options, title: `Lv. ${level}`, charts: group.charts }));
}

/**
 * One chart per difficulty of a song, from BASIC upwards. A `null` level leaves that difficulty out.
 */
function allDifficulties(title: string, type: Type, levels: (number | null)[], ids?: ChartRef["ids"]): ChartRef[] {
    return levels.flatMap((level, i) => (level == null ? [] : [{ title, type, difficulty: DIFFICULTIES[i], level, ids }]));
}

/**
 * A song of a version folder, so it can be listed in a single line.
 *
 * @param levels One internal level per difficulty from BASIC upwards. A `null` level leaves that difficulty out.
 * @param options `jp` and `intl` override the levels or identifiers in that region, or leave the song out of it with `false`.
 */
export function song(title: string, type: Type, levels: (number | null)[], options?: Omit<SongRef, "title" | "type" | "levels">): SongRef {
    return { ...options, title, type, levels };
}

/**
 * One collection per goal, grouped under the id of `base` so users pick the goal separately.
 *
 * @param plate First half of the version plate, e.g. `"丸"`, to name the plate of each goal.
 */
export function withGoals(
    base: Omit<FolderDefinition, "lamp" | "check" | "group" | "variant">,
    goals: GoalKey[],
    plate?: string,
): FolderDefinition[] {
    return goals.map((key) => {
        const goal = GOALS[key];
        return {
            ...base,
            id: `${base.id}-${key}`,
            title: `${base.title} ${goal.name}`,
            ...(plate ? { plate: `${plate}${goal.plate}` } : {}),
            lamp: goal.lamp,
            check: goal.check,
            group: base.id,
            groupTitle: base.groupTitle ?? base.title,
            variant: key,
        };
    });
}

const REGIONS: Record<Region, { name: string; aliases: string[] }> = {
    jp: { name: "Japan", aliases: ["jp", "japan", "日本"] },
    intl: { name: "International", aliases: ["intl", "international", "国际"] },
    ca: { name: "Canada", aliases: ["ca", "canada"] },
};

/**
 * Folder collections of a version, for Japan, International and Canada, one per goal.
 *
 * Songs are in both Japan and International unless marked otherwise. Canada takes the songs of International,
 * without the ones the local database marks as locked in North America. Only the hard charts are drawn by default, see `compact`.
 */
export function versionFolders(options: {
    id: string;
    /**
     * Name of the version, e.g. `"CiRCLE"`.
     */
    version: string;
    /**
     * Full name of the version, without the region. Defaults to `"maimai DX"` followed by `version`.
     */
    title?: string;
    /**
     * First half of the version plate, e.g. `"丸"`.
     */
    plate: string;
    songs: SongRef[];
    goals: GoalKey[];
    aliases?: string[];
    /**
     * Charts drawn by default, as players going for a plate mostly care about the hard ones. Defaults to MASTER and Lv. 13 and above.
     */
    compact?: (chart: ChartRef) => boolean;
}): FolderDefinition[] {
    const charts = (region: "jp" | "intl") =>
        options.songs.flatMap((song) => {
            const override = song[region];
            if (override === false) return [];
            return allDifficulties(song.title, song.type, override?.levels ?? song.levels, override?.ids ?? song.ids);
        });
    const regions = { jp: charts("jp"), intl: charts("intl"), ca: charts("intl") } satisfies Record<Region, ChartRef[]>;
    const title = options.title ?? `maimai DX ${options.version}`;
    return (Object.keys(regions) as Region[]).flatMap((region) =>
        withGoals(
            {
                id: `${options.id}-${region}`,
                title: `${title} (${REGIONS[region].name})`,
                groupTitle: `${title} ${options.plate} (${REGIONS[region].name})`,
                folders: byLevel(regions[region]),
                compact: options.compact ?? ((chart) => chart.difficulty === Difficulty.MASTER || chart.level >= 13),
                aliases: [...(options.aliases ?? []), options.version, options.plate, ...REGIONS[region].aliases],
                ...(region === "ca" ? { excludeUsaLocked: true as const } : {}),
            },
            options.goals,
            options.plate,
        ),
    );
}
