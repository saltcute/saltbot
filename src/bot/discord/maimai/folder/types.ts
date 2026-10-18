import type { Difficulty, Type } from "gcm-database/maimai";
import type { Folder, FolderLamp } from "maidraw/maimai";

/**
 * Database instances a folder can be resolved against. See `../database`.
 */
export type DatabaseKey = "local" | "otogedb" | "otogedbIntl";

/**
 * Game regions a version folder can be built for. Canada is International without the songs locked in North America.
 */
export type Region = "jp" | "intl" | "ca";

/**
 * A database-agnostic reference to a single chart.
 */
export interface ChartRef {
    /**
     * Must match the title in the database exactly.
     */
    title: string;
    type: Type;
    difficulty: Difficulty;
    /**
     * Internal level. Only used to rank candidates, so songs sharing a title can be told apart.
     */
    level: number;
    /**
     * Per-database identifier overrides, for charts that cannot be found by title in that database.
     *
     * `null` marks the chart as known to be absent from that database, so it is skipped silently.
     */
    ids?: Partial<Record<DatabaseKey, string | null>>;
}

/**
 * A single folder, drawn as one titled group of jackets.
 */
export interface FolderEntry {
    title: string;
    /**
     * Overrides the lamp of the collection.
     */
    lamp?: FolderLamp;
    /**
     * Overrides the check of the collection.
     */
    check?: Folder["check"];
    charts: ChartRef[];
}

/**
 * A collection of folders, drawn together in one image.
 */
export interface FolderDefinition {
    /**
     * Unique and stable. Used as the value users pick the collection by, unless it is part of a group.
     */
    id: string;
    title: string;
    lamp: FolderLamp;
    check?: Folder["check"];
    folders: FolderEntry[];
    /**
     * Other names the collection can be searched by. Never displayed.
     */
    aliases?: string[];
    /**
     * Shared by the variants of one collection, which users pick by this value instead of `id`.
     */
    group?: string;
    /**
     * Title of the group, without the variant.
     */
    groupTitle?: string;
    /**
     * Unique within the group. Picked separately from the collection.
     */
    variant?: string;
    /**
     * Leave out charts locked in North America, as marked in the local database.
     */
    excludeUsaLocked?: true;
    /**
     * Full name of the plate this collection is for, e.g. `"丸将"`.
     */
    plate?: string;
    /**
     * Charts drawn by default. Users can still ask for every chart. Every chart is drawn when not set.
     */
    compact?: (chart: ChartRef) => boolean;
}

/**
 * What a folder collection checks charts off by, e.g. SSS on every chart.
 */
export interface Goal {
    name: string;
    /**
     * Second half of the version plate for this goal, e.g. `"将"` in `"丸将"`.
     */
    plate: string;
    lamp: FolderLamp;
    check: NonNullable<Folder["check"]>;
}

/**
 * Overrides for one region of a song in a version folder. `false` leaves the song out of that region.
 */
export type SongRegionOptions = false | { levels?: (number | null)[]; ids?: ChartRef["ids"] };

/**
 * A song of a version folder, with one level per difficulty from BASIC upwards.
 */
export interface SongRef {
    title: string;
    type: Type;
    levels: (number | null)[];
    ids?: ChartRef["ids"];
    jp?: SongRegionOptions;
    intl?: SongRegionOptions;
}
