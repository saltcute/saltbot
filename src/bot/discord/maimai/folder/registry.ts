import { logger } from "@saltcute/logger";
import { FOLDERS } from "./definitions";
import { resolveFolder } from "./resolve";
import type { ChartRef, DatabaseKey, FolderDefinition } from "./types";

export interface FolderChoice {
    /**
     * The group of the collection, or its id if it has no group.
     */
    value: string;
    name: string;
    searchKeys: { id: string; title: string; aliases: string[] };
}

const FOLDERS_BY_ID = new Map<string, FolderDefinition>();
const GROUPS = new Map<string, FolderDefinition[]>();
for (const folder of FOLDERS) {
    if (FOLDERS_BY_ID.has(folder.id)) throw new Error(`Duplicate maimai folder id "${folder.id}".`);
    FOLDERS_BY_ID.set(folder.id, folder);
    if (folder.group) {
        const variants = GROUPS.get(folder.group) ?? [];
        if (variants.some((variant) => variant.variant === folder.variant)) {
            throw new Error(`Duplicate variant "${folder.variant}" in maimai folder group "${folder.group}".`);
        }
        variants.push(folder);
        GROUPS.set(folder.group, variants);
    }
}

const CHOICES: FolderChoice[] = [];
for (const folder of FOLDERS) {
    if (folder.group) {
        if (FOLDERS_BY_ID.has(folder.group)) throw new Error(`Maimai folder group "${folder.group}" clashes with a folder id.`);
        if (CHOICES.some((choice) => choice.value === folder.group)) continue;
        const variants = GROUPS.get(folder.group) ?? [];
        const title = folder.groupTitle ?? folder.title;
        CHOICES.push({
            value: folder.group,
            name: title,
            searchKeys: { id: folder.group, title, aliases: [...new Set(variants.flatMap((variant) => variant.aliases ?? []))] },
        });
    } else {
        CHOICES.push({ value: folder.id, name: folder.title, searchKeys: { id: folder.id, title: folder.title, aliases: folder.aliases ?? [] } });
    }
}
// Regions of a version share aliases on purpose, but an alias naming another choice is most likely a mistake.
for (const choice of CHOICES) {
    for (const alias of choice.searchKeys.aliases) {
        const other = CHOICES.find((other) => other !== choice && other.value.toLowerCase() === alias.toLowerCase());
        if (other) logger.warn(`[maimai] Folder alias "${alias}" of "${choice.value}" is the id of "${other.value}".`);
    }
}

export function getFolder(id: string): FolderDefinition | null {
    return FOLDERS_BY_ID.get(id) ?? null;
}

export function getAllFolders(): FolderDefinition[] {
    return FOLDERS;
}

/**
 * One choice per group of collections, or per collection without a group, in load order.
 */
export function getFolderChoices(): FolderChoice[] {
    return CHOICES;
}

/**
 * Choices whose id, title or aliases contain the query, ignoring case. Every choice when the query is empty.
 */
export function searchFolders(query: string): FolderChoice[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return CHOICES;
    return CHOICES.filter(({ searchKeys }) =>
        [searchKeys.id, searchKeys.title, ...searchKeys.aliases].some((key) => key.toLowerCase().includes(needle)),
    );
}

/**
 * Variants of a group, in load order. Empty for a collection without a group.
 */
export function getVariants(value: string): FolderDefinition[] {
    return GROUPS.get(value) ?? [];
}

/**
 * The collection picked by a choice value and an optional variant.
 * A group without a variant gives its first variant, and a collection without a group ignores the variant.
 */
export function findFolder(value: string, variant?: string | null): FolderDefinition | null {
    const variants = GROUPS.get(value);
    if (!variants) return FOLDERS_BY_ID.get(value) ?? null;
    if (!variant) return variants[0] ?? null;
    return variants.find((definition) => definition.variant === variant) ?? null;
}

/**
 * Resolve every folder against every database, returning the charts that cannot be found.
 */
export async function validateFolders(
    keys: DatabaseKey[] = ["local", "otogedb", "otogedbIntl"],
): Promise<{ folder: string; database: DatabaseKey; missing: ChartRef[] }[]> {
    // Resolved one at a time, for the same reason as the charts in `resolveFolder`.
    const results: { folder: string; database: DatabaseKey; missing: ChartRef[] }[] = [];
    for (const definition of FOLDERS) {
        for (const key of keys) {
            results.push({ folder: definition.id, database: key, missing: (await resolveFolder(definition, key, true)).missing });
        }
    }
    return results.filter((result) => result.missing.length);
}
