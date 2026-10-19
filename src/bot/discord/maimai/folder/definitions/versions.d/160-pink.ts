import { Type } from "gcm-database/maimai";
import { song, versionFolders } from "../../helpers";

/**
 * Charts are in the version their region of the game says, so Japan and International differ in a few songs.
 * Japan uses its internal levels, and International overrides them where they differ. Utage and Re:MASTER charts are left out,
 * as only BASIC to MASTER count towards the plate.
 */
export default versionFolders({
    id: "version-pink",
    version: "PiNK",
    title: "maimai PiNK",
    plate: "桃",
    goals: ["sss", "fc", "ap", "fdx"],
    songs: [
        song("物凄い勢いでけーねが物凄いうた", Type.STANDARD, [5, 8, 9.8, 13.4], { intl: { levels: [5, 7.3, 9.8, 13.4] } }),
        song("初音ミクの消失", Type.STANDARD, [6, 9.5, 11.8, 13.9], { intl: { levels: [6, 8.8, 11.8, 13.9] } }),
        song("+♂", Type.STANDARD, [5, 9, 10.6, 13.4], { intl: { levels: [5, 8.3, 10.6, 13.4] } }),
        song("すろぉもぉしょん", Type.STANDARD, [4, 8, 9.7, 12.7], { intl: false }),
        song("Counselor", Type.STANDARD, [4, 8.5, 10.7, 12.4], { intl: { levels: [4, 7.8, 10.7, 12.4] } }),
        song("言ノ葉遊戯", Type.STANDARD, [4, 8.5, 10.9, 12.7], { intl: { levels: [4, 7.8, 10.9, 12.7] } }),
        song("りばーぶ", Type.STANDARD, [3, 7.7, 9.9, 11.4], { intl: { levels: [3, 7, 9.9, 11.4] } }),
        song("幾四音-Ixion-", Type.STANDARD, [5, 9.3, 10.8, 13.3], { intl: { levels: [5, 8.6, 10.8, 13.3] } }),
        song("閃鋼のブリューナク", Type.STANDARD, [5, 9.5, 11.8, 13.9], { intl: { levels: [5, 8.8, 11.8, 13.9] } }),
        song("アージェントシンメトリー", Type.STANDARD, [5, 7.9, 10.9, 13.5], { intl: { levels: [5, 7.2, 10.9, 13.5] } }),
        song("HIMITSUスパーク", Type.STANDARD, [5, 8.3, 10.1, 13.2], { intl: { levels: [5, 7.6, 10.1, 13.2] } }),
        song("Party 4U ”holy nite mix”", Type.STANDARD, [4, 8.5, 11.8, 13.7], { intl: { levels: [4, 7.8, 11.8, 13.7] } }),
        song("LOL -lots of laugh-", Type.STANDARD, [4, 7.7, 10.6, 12.7], { intl: false }),
        song("イノコリ先生", Type.STANDARD, [4, 8.2, 9.9, 12.9], { intl: { levels: [4, 7.5, 9.9, 12.7] } }),
        song("Revive The Rave", Type.STANDARD, [6, 9.5, 12.7, 13.8], { intl: { levels: [6, 8.8, 12.7, 13.8] } }),
        song("厨病激発ボーイ", Type.STANDARD, [6, 8.9, 10.9, 13.8], { intl: { levels: [6, 8.2, 10.9, 13.8] } }),
        song("YU-MU", Type.STANDARD, [4, 8.2, 10.8, 13.2], { intl: { levels: [4, 7.5, 10.8, 13.2] } }),
        song("フラグメンツ -T.V. maimai edit-", Type.STANDARD, [4, 7.3, 9.9, 12.8], { intl: { levels: [4, 6.6, 9.9, 12.8] } }),
        song("願いを呼ぶ季節", Type.STANDARD, [4, 8, 10.4, 12.5], { intl: { levels: [4, 7.3, 10.4, 12.5] } }),
        song("囲い無き世は一期の月影", Type.STANDARD, [5, 8.7, 10.7, 12.6], { intl: { levels: [5, 8, 10.7, 12.6] } }),
        song("After Burner", Type.STANDARD, [6, 9.3, 11.8, 13.7], { intl: { levels: [6, 8.6, 11.8, 13.7] } }),
        song("7thSense", Type.STANDARD, [6, 9.5, 11.8, 14.4], { intl: { levels: [6, 8.8, 11.8, 14.4] } }),
        song("ラブリー☆えんじぇる!!", Type.STANDARD, [5, 8, 10.1, 12.5], { intl: { levels: [5, 7.3, 10.1, 12.5] } }),
        song("オモイヨシノ", Type.STANDARD, [4, 8.5, 10.8, 13.3], { intl: { levels: [4, 7.8, 10.8, 13.3] } }),
        song("GEMINI -M-", Type.STANDARD, [7, 8.5, 11.9, 13.9], { intl: { levels: [7, 7.8, 11.9, 13.9] } }),
        song("ありふれたせかいせいふく", Type.STANDARD, [5, 8.3, 9.9, 13.6], { intl: { levels: [5, 7.6, 9.9, 13.6] } }),
        song("頓珍漢の宴", Type.STANDARD, [5, 9.4, 11.7, 13.8], { intl: { levels: [5, 8.7, 11.7, 13.8] } }),
        song("Garden Of The Dragon", Type.STANDARD, [2, 7.7, 11.9, 13.5], { intl: { levels: [2, 7, 11.9, 13.5] } }),
        song("FEEL the BEATS", Type.STANDARD, [5, 9.3, 11.6, 13.6], { intl: { levels: [5, 8.6, 11.6, 13.6] } }),
        song("スリップフリップ", Type.STANDARD, [4, 9, 10.7, 13.8], { intl: { levels: [4, 8.3, 10.7, 13.8] } }),
        song("橙の幻想郷音頭", Type.STANDARD, [5, 7.7, 11, 13.3], { intl: { levels: [5, 7, 11, 13.3] } }),
        song("東方妖々夢 ～the maximum moving about～", Type.STANDARD, [6, 9, 9.9, 13.3], { intl: { levels: [6, 8.3, 9.9, 13.3] } }),
        song("蒼空に舞え、墨染の桜", Type.STANDARD, [6, 7.9, 11, 13.4], { intl: { levels: [6, 7.2, 11, 13.4] } }),
        song("少女幻葬戦慄曲 ～ Necro Fantasia", Type.STANDARD, [6, 8.9, 10.8, 13.9], { intl: { levels: [6, 8.2, 10.8, 13.9] } }),
        song("Jimang Shot", Type.STANDARD, [6, 8.3, 10.6, 13.3], { intl: { levels: [6, 7.6, 10.6, 13.3] } }),
        song("Glorious Crown", Type.STANDARD, [7, 11.1, 13.2, 14.8], { intl: { levels: [7, 10.5, 13.2, 14.8] } }),
    ],
});
