import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";

export interface BotConfig {
    "maimai::lxns.token": string;
    "maimai::divingFish.token": string;

    "maimai::config.useLocalDatabase": boolean;
    "maimai::config.localDatabasePath": string;

    "maimai::config.useLocalOtogedbDatabase": boolean;
    "maimai::config.otogedbDatabasePath": string;

    "discord::auth.clientId": string;
    "discord::auth.token": string;
    "discord::auth.clientSecret": string;

    "webui::config.baseUrl": string;
    "webui::config.sessionSecret": string;
}

let cache: Partial<BotConfig> | undefined;

/**
 * Read and parse `config.json5`, located via `CONFIG_PATH` (defaults to
 * `src/config/config.json5`). Parsed once and cached.
 */
function load(): Partial<BotConfig> {
    if (cache) return cache;
    const configPath = process.env.CONFIG_PATH || path.resolve(__dirname, "../../config/config.json5");
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file ${configPath} does not exist`);
    }
    cache = JSON5.parse(fs.readFileSync(configPath, { encoding: "utf-8" })) as Partial<BotConfig>;
    return cache;
}

export function getConfig<K extends keyof BotConfig>(key: K): BotConfig[K] {
    return load()[key] as BotConfig[K];
}
