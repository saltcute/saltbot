import { client as kasumi } from "@kook/init/client";
import { Database } from "gcm-database-local/maimai";

export const database = new Database(kasumi.config.getSync("maimai::config.localDatabasePath"));
