import * as fs from "node:fs";
import { logger } from "@saltcute/logger";
import upath from "upath";
import type { FolderDefinition } from "../types";

/**
 * Hand-written folders. Every file in this directory and its subdirectories default-exports one folder collection, or an array of them,
 * and is loaded automatically, in path order. Files named `index` are skipped, so they can hold shared helpers.
 *
 * @example
 * // ./favourites.ts
 * import { Difficulty, Type } from "gcm-database/maimai";
 * import { FolderLamp } from "maidraw/maimai";
 * import { byLevel } from "../helpers";
 * import type { FolderDefinition } from "../types";
 *
 * export default {
 *     id: "favourites",
 *     title: "Favourites",
 *     lamp: FolderLamp.ACHIEVEMENT_RANK,
 *     check: (score) => score.achievement >= 100.5,
 *     aliases: ["fav"],
 *     folders: [
 *         {
 *             title: "Stamina",
 *             lamp: FolderLamp.COMBO,
 *             charts: [
 *                 { title: "...", type: Type.DELUXE, difficulty: Difficulty.MASTER, level: 14.6 },
 *                 // Title differs in otogedb, and the song is not available internationally.
 *                 { title: "...", type: Type.STANDARD, difficulty: Difficulty.EXPERT, level: 12.8, ids: { otogedb: "123", otogedbIntl: null } },
 *             ],
 *         },
 *         // Or split a flat list into one folder per level.
 *         ...byLevel([{ title: "...", type: Type.DELUXE, difficulty: Difficulty.MASTER, level: 13.7 }]),
 *     ],
 * } satisfies FolderDefinition;
 *
 * @example
 * // Let users pick from a few goals instead, see `withGoals`.
 * export default withGoals({ id: "favourites", title: "Favourites", folders: [...] }, ["sss", "ap"]);
 *
 * @example
 * // A version, for every region and goal, see `versionFolders`.
 * export default versionFolders({ id: "version-circle", version: "CiRCLE", plate: "丸", goals: ["sss"], songs: [song("...", Type.DELUXE, [3, 7, 10.5, 13.2])] });
 */
function loadFolders(): FolderDefinition[] {
    const folders: FolderDefinition[] = [];
    const files = fs
        .readdirSync(__dirname, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.(ts|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts") && upath.trimExt(entry.name) !== "index")
        .map((entry) => upath.relative(__dirname, upath.join(entry.parentPath, entry.name)))
        .sort();
    for (const file of files) {
        try {
            const exported: FolderDefinition | FolderDefinition[] | undefined = require(upath.join(__dirname, file)).default;
            const definitions = Array.isArray(exported) ? exported : [exported];
            if (!definitions.length || definitions.some((folder) => !folder?.id || !Array.isArray(folder.folders))) {
                logger.error(`[maimai] Folder file ${file} does not default-export folder definitions.`);
                continue;
            }
            folders.push(...(definitions as FolderDefinition[]));
        } catch (e) {
            logger.withError(e).error(`[maimai] Error loading folder file ${file}`);
        }
    }
    return folders;
}

export const FOLDERS: FolderDefinition[] = loadFolders();
