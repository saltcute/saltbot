import { Database } from "gcm-database-local/maimai";
import { CdnSource, LocalSource, Database as OtogeDbDatabase } from "gcm-database-otogedb/maimai";
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
