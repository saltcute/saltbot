import "./bot/kook";

import axios from "axios";
import { Util } from "./bot/util";

axios.defaults.headers.common["User-Agent"] = Util.getUserAgent();

import "./bot/discord";
