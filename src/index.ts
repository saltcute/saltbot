import { logger } from "@saltcute/logger";
import axios from "axios";
import { closeDatabase, connectDatabase } from "./bot/core/database";
import { Util } from "./bot/util";

axios.defaults.headers.common["User-Agent"] = Util.getUserAgent();

import { client, login } from "./bot/discord";

(async () => {
    await connectDatabase();
    await login();
})().catch((e) => {
    logger.withError(e).fatal("Failed to start");
    process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, async () => {
        await client.destroy();
        await closeDatabase();
        process.exit(0);
    });
}
