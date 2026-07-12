import { Database } from "gcm-database-local/chunithm";
import { CdnSource, LocalSource, Database as OtogeDbDatabase } from "gcm-database-otogedb/chunithm";
import { client as kasumi } from "@/bot/kook/init/client";

export const database = new Database(kasumi.config.getSync("maimai::config.localDatabasePath"));

export const otogedb = new OtogeDbDatabase(
    kasumi.config.getSync("maimai::config.useLocalOtogedbDatabase")
        ? new LocalSource(kasumi.config.getSync("maimai::config.otogedbDatabasePath"))
        : new CdnSource(),
);
export const otogedbIntl = new OtogeDbDatabase(
    kasumi.config.getSync("maimai::config.useLocalOtogedbDatabase")
        ? new LocalSource(kasumi.config.getSync("maimai::config.otogedbDatabasePath"))
        : new CdnSource(),
    "INT",
);
