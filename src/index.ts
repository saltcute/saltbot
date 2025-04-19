import { client as kasumi } from "@/kook/init/client";
import "./kook";
import "./util";

kasumi.on("connect.*", () => {
    require("./discord");
});
