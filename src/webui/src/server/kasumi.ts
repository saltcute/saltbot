import Kasumi from "kasumi.js";

/**
 * Subset of the bot's `CustomStorage` (src/bot/kook/init/type.ts) that the web
 * interface needs. Kept as a local copy so the webui does not import from the
 * bot source tree across the workspace boundary.
 */
export type GcmTracker = "gcm-net" | "gcm-net-ex";

interface WebuiStorage {
    "discord::auth.clientId": string;
    "discord::auth.clientSecret": string;
    "webui::config.baseUrl": string;
    "webui::config.sessionSecret": string;
    [k: `salt::connection.discord.${GcmTracker}.${string}`]: string | undefined;
}

/**
 * A Kasumi config client that mirrors the bot's
 * {@link file://src/bot/kook/init/client.ts}. With `CONFIG_PATH` set, the Kasumi
 * constructor loads the same `config.json5` and, because
 * `kasumi::config.database === "mongodb"`, auto-connects to the same MongoDB.
 * This is the single source of truth for both reading config and persisting
 * linked credentials, so the bot reads them back via `kasumi.config.getOne`.
 */
export const client = new Kasumi<WebuiStorage>();

export function getConfig<K extends keyof WebuiStorage>(key: K): WebuiStorage[K] {
    return client.config.getSync(key as string);
}

/** Persist an encrypted gcm-net credential token under the user's Discord id. */
export function saveLink(tracker: GcmTracker, discordUserId: string, token: string): void {
    client.config.set(`salt::connection.discord.${tracker}.${discordUserId}`, token);
}

/** Read back a stored credential token (used to show "already linked" status). */
export function getLink(tracker: GcmTracker, discordUserId: string): Promise<string | undefined> {
    return client.config.getOne(`salt::connection.discord.${tracker}.${discordUserId}`);
}
