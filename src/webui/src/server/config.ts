import fs from "node:fs";
import JSON5 from "json5";

/**
 * Subset of the bot's `CustomStorage` (src/bot/kook/init/type.ts) that the web
 * interface needs. Kept as a local copy so the webui does not import from the
 * bot source tree across the workspace boundary.
 */
export type GcmTracker = "gcm-net" | "gcm-net-intl";
export type GcmService = "maimaidx" | "chunithm" | "ongeki";

/**
 * The config keys the webui reads. The `discord::*`/`webui::*` keys back the
 * OAuth flow and session signing; the `kasumi::config.mongo*` keys back the
 * direct MongoDB connection used for linked credentials (see `mongo.ts`).
 */
interface WebuiConfig {
    "discord::auth.clientId": string;
    "discord::auth.clientSecret": string;
    "webui::config.baseUrl": string;
    "webui::config.sessionSecret": string;
    "kasumi::config.mongoConnectionString": string;
    "kasumi::config.mongoDatabaseName": string;
    "kasumi::config.mongoCollectionName": string;
}

let cache: Record<string, unknown> | undefined;

/**
 * Read and parse the same `config.json5` the bot uses, located via `CONFIG_PATH`.
 * Mirrors Kasumi's loader so both processes share a single source of truth, but
 * without pulling in the whole bot framework. Parsed once and cached.
 */
function load(): Record<string, unknown> {
    if (cache) return cache;
    const path = process.env.CONFIG_PATH;
    if (!path || !fs.existsSync(path)) {
        throw new Error("CONFIG_PATH is not set or the config file does not exist");
    }
    const parsed = JSON5.parse(fs.readFileSync(path, { encoding: "utf-8" })) as Record<string, unknown>;
    cache = parsed;
    return parsed;
}

export function getConfig<K extends keyof WebuiConfig>(key: K): WebuiConfig[K] {
    return load()[key] as WebuiConfig[K];
}
