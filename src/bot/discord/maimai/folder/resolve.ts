import type { Chart, Database } from "gcm-database/maimai";
import type { Chart as LocalChart } from "gcm-database-local/maimai";
import type { Folder } from "maidraw/maimai";
import { client as kasumi } from "@/bot/kook/init/client";
import { database, otogedb, otogedbIntl } from "../database";
import type { ChartRef, DatabaseKey, FolderDefinition } from "./types";

const DATABASES: Record<DatabaseKey, Database<Chart>> = {
    local: database,
    otogedb,
    otogedbIntl,
};

/**
 * Resolved folders are kept for this long, so database updates are eventually picked up.
 */
const CACHE_TTL = 60 * 60 * 1000;

export interface ResolvedFolder {
    /**
     * One folder per entry of the collection. Folders with no charts found are left out.
     */
    folders: Folder[];
    /**
     * Charts that could not be found in the database.
     */
    missing: ChartRef[];
}

const cache = new Map<string, { expires: number; result: Promise<ResolvedFolder> }>();

async function resolveChart(key: DatabaseKey, ref: ChartRef): Promise<Chart | null> {
    const db = DATABASES[key];
    const id = ref.ids?.[key];
    if (id) {
        const { data } = await db.getChart(id, ref.difficulty);
        return data ?? null;
    }
    const { data } = await db.searchChart(
        {
            title: ref.title,
            level: ref.level,
            difficulty: ref.difficulty,
            type: ref.type,
        },
        { maxResultCount: 1 },
    );
    return data?.[0]?.chart ?? null;
}

/**
 * Whether a chart is locked in North America in the latest International version, according to the local database.
 * `null` when the chart cannot be found there.
 */
async function isUsaLocked(ref: ChartRef): Promise<boolean | null> {
    if (ref.ids?.local === null) return null;
    const chart = (await resolveChart("local", ref)) as LocalChart | null;
    if (!chart) return null;
    const presences = chart.optionalData.presences.filter((presence) => presence.version.region === "EX");
    const latest = presences.reduce<(typeof presences)[number]["version"] | null>((latest, { version }) => {
        if (!latest) return version;
        const { major, minor } = version.gameVersion;
        return major > latest.gameVersion.major || (major === latest.gameVersion.major && minor > latest.gameVersion.minor) ? version : latest;
    }, null);
    return presences.some((presence) => presence.type === "usa_lock" && presence.version.name === latest?.name);
}

async function doResolveFolder(definition: FolderDefinition, key: DatabaseKey, full: boolean): Promise<ResolvedFolder> {
    const missing: ChartRef[] = [];
    const unchecked: ChartRef[] = [];
    const folders: Folder[] = [];
    // Charts are resolved one at a time. Every lookup misses a cold database cache when run concurrently,
    // and each miss loads (and serializes) the whole database, which runs the process out of memory.
    for (const entry of definition.folders) {
        const elements: Chart[] = [];
        for (const ref of entry.charts) {
            if (ref.ids?.[key] === null) continue;
            if (!full && definition.compact && !definition.compact(ref)) continue;
            if (definition.excludeUsaLocked) {
                const locked = await isUsaLocked(ref);
                if (locked) continue;
                if (locked === null) unchecked.push(ref);
            }
            const chart = await resolveChart(key, ref);
            if (chart) elements.push(chart);
            else missing.push(ref);
        }
        folders.push({
            title: entry.title,
            lamp: entry.lamp ?? definition.lamp,
            check: entry.check ?? definition.check,
            elements,
        });
    }
    if (missing.length) {
        kasumi.logger.warn(
            `[maimai] Folder "${definition.id}" has ${missing.length} unresolved chart(s) in ${key}: ${missing
                .map((ref) => `${ref.title} (${ref.type} ${ref.difficulty})`)
                .join(", ")}`,
        );
    }
    if (unchecked.length) {
        kasumi.logger.warn(
            `[maimai] Folder "${definition.id}" has ${unchecked.length} chart(s) not in the local database, kept without checking for a USA lock: ${unchecked
                .map((ref) => `${ref.title} (${ref.type} ${ref.difficulty})`)
                .join(", ")}`,
        );
    }
    return {
        folders: folders.filter((folder) => folder.elements.length),
        missing,
    };
}

/**
 * Resolve a folder collection against one of the databases.
 *
 * Make sure `key` is the database the score adapter drawing this folder uses,
 * as scores are matched to charts by identifier.
 *
 * @param full Resolve every chart, instead of only the `compact` ones of the collection.
 */
export function resolveFolder(definition: FolderDefinition, key: DatabaseKey, full = false): Promise<ResolvedFolder> {
    const cacheKey = `${key}:${definition.id}:${full || !definition.compact ? "full" : "compact"}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.result;

    const result = doResolveFolder(definition, key, full);
    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, result });
    result.catch(() => {
        if (cache.get(cacheKey)?.result === result) cache.delete(cacheKey);
    });
    return result;
}
