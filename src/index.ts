import "./kook";

import { Util } from "./util";
import axios from "axios";
axios.defaults.headers.common["User-Agent"] = Util.getUserAgent();

import "./discord";
