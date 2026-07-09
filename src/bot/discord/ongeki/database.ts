import { Database } from "gcm-database-local/ongeki";
import { CdnSource, LocalSource, Database as OtogeDbDatabase } from "gcm-database-otogedb/ongeki";
import { client as kasumi } from "@/bot/kook/init/client";

export const database = new Database(kasumi.config.getSync("maimai::config.localDatabasePath"));

export const otogedb = new OtogeDbDatabase(
    kasumi.config.getSync("maimai::config.useLocalOtogedbDatabase")
        ? new LocalSource(kasumi.config.getSync("maimai::config.otogedbDatabasePath"))
        : new CdnSource(),
);
