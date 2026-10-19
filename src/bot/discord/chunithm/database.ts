import { Database } from "gcm-database-local/chunithm";
import { CdnSource, LocalSource, Database as OtogeDbDatabase } from "gcm-database-otogedb/chunithm";
import { getConfig } from "@/bot/core/config";

export const database = new Database(getConfig("maimai::config.localDatabasePath"));

export const otogedb = new OtogeDbDatabase(
    getConfig("maimai::config.useLocalOtogedbDatabase") ? new LocalSource(getConfig("maimai::config.otogedbDatabasePath")) : new CdnSource(),
);
export const otogedbIntl = new OtogeDbDatabase(
    getConfig("maimai::config.useLocalOtogedbDatabase") ? new LocalSource(getConfig("maimai::config.otogedbDatabasePath")) : new CdnSource(),
    "INT",
);
