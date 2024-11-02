import { client as kasumi } from "@/kook/init/client";
import "./kook";

kasumi.on("connect.*", () => {
    require("./discord");
});
