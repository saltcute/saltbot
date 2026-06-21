import "./kook";

import axios from "axios";
import { Util } from "./util";

axios.defaults.headers.common["User-Agent"] = Util.getUserAgent();

import "./discord";
