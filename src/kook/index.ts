import { client } from "@/kook/init/client";
import EssentialMenu from "@saltcute/kasumi-essential";
import MaiMenu from "@saltcute/kasumi-maimai";
import * as fs from "fs";
import upath from "upath";

(async () => {
    await client.connect();
    client.plugin.load(new MaiMenu(), new EssentialMenu());
    const basicPath = upath.join(__dirname, "menu");
    const menus = fs.readdirSync(basicPath);
    for (const menu of menus) {
        try {
            require(upath.join(basicPath, menu, "index"));
        } catch (e) {
            client.logger.error("Error loading menu");
            client.logger.error(e);
        }
    }
})();
