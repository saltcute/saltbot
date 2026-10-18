import { ComboLamp, compareComboLamp, compareSyncLamp, FolderLamp, SyncLamp } from "maidraw/maimai";
import type { Goal } from "./types";

/**
 * Goals of the version plates. Better lamps count too, e.g. AP+ checks off a chart for FC.
 */
export const GOALS = {
    fc: {
        name: "FC",
        plate: "極",
        lamp: FolderLamp.COMBO,
        check: (score) => compareComboLamp(score.combo, ComboLamp.FULL_COMBO) >= 0,
    },
    sss: {
        name: "SSS",
        plate: "将",
        lamp: FolderLamp.ACHIEVEMENT_RANK,
        check: (score) => score.achievement >= 100,
    },
    ap: {
        name: "AP",
        plate: "神",
        lamp: FolderLamp.COMBO,
        check: (score) => compareComboLamp(score.combo, ComboLamp.ALL_PERFECT) >= 0,
    },
    fdx: {
        name: "FDX",
        plate: "舞舞",
        lamp: FolderLamp.SYNC,
        check: (score) => compareSyncLamp(score.sync, SyncLamp.FULL_SYNC_DX) >= 0,
    },
} satisfies Record<string, Goal>;

export type GoalKey = keyof typeof GOALS;
