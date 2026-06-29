import { Database } from "gcm-database-local/chunithm";
import { client as kasumi } from "@/bot/kook/init/client";

export const database = new Database(kasumi.config.getSync("maimai::config.localDatabasePath"));
