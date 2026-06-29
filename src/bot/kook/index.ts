import * as fs from "node:fs";
import EssentialMenu from "@saltcute/kasumi-essential";
import MaiMenu from "@saltcute/kasumi-maimai";
import upath from "upath";
import { client } from "@/bot/kook/init/client";

(async () => {
    if (client.config.getSync("kasumi::config.token")) {
        await client.connect();
        client.plugin.load(new MaiMenu(), new EssentialMenu());
        const basicPath = upath.join(__dirname, "menu");
        if (!fs.existsSync(basicPath)) return;
        const menus = fs.readdirSync(basicPath);
        for (const menu of menus) {
            try {
                require(upath.join(basicPath, menu, "index"));
            } catch (e) {
                client.logger.error("Error loading menu");
                client.logger.error(e);
            }
        }
    }
})();
