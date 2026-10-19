import { Type } from "gcm-database/maimai";
import { song, versionFolders } from "../../helpers";

/**
 * Charts are in the version their region of the game says, so Japan and International differ in a few songs.
 * Japan uses its internal levels, and International overrides them where they differ. Utage and Re:MASTER charts are left out,
 * as only BASIC to MASTER count towards the plate.
 */
export default versionFolders({
    id: "version-orange-plus",
    version: "ORANGE PLUS",
    title: "maimai ORANGE PLUS",
    plate: "暁",
    aliases: ["晓"],
    goals: ["sss", "fc", "ap", "fdx"],
    songs: [
        song("ナミダと流星", Type.STANDARD, [5, 8.5, 10.8, 12.5], { intl: { levels: [5, 7.8, 10.8, 12.5] } }),
        song("みくみくにしてあげる♪【してやんよ】", Type.STANDARD, [4, 7.5, 9.4, 11.9], { intl: { levels: [4, 6.8, 9.4, 11.9] } }),
        song("ロストワンの号哭", Type.STANDARD, [4, 7.5, 10.8, 13.6], { intl: { levels: [4, 6.8, 10.8, 13.6] } }),
        song("ケロ⑨destiny", Type.STANDARD, [4, 8, 10.9, 13], { intl: { levels: [4, 7.3, 10.9, 13] } }),
        song("ってゐ！ ～えいえんてゐVer～", Type.STANDARD, [3, 8, 9.7, 12.5], { intl: { levels: [3, 7.3, 9.7, 12.5] } }),
        song("L9", Type.STANDARD, [5, 9, 11.1, 13.7], { intl: { levels: [5, 8.3, 11.1, 13.7] } }),
        song("赤心性：カマトト荒療治", Type.STANDARD, [5, 8.5, 9.9, 13.7], { intl: { levels: [5, 7.8, 9.9, 13.7] } }),
        song("響縁", Type.STANDARD, [5, 7.5, 9.7, 13], { intl: { levels: [5, 6.8, 9.7, 13] } }),
        song("悪戯", Type.STANDARD, [5, 7.9, 10.4, 12.9], { intl: { levels: [5, 7.2, 10.4, 12.9] } }),
        song("welcome to maimai!! with マイマイマー", Type.STANDARD, [6, 8.7, 9.9, 12.9], { intl: { levels: [6, 8, 9.9, 12.9] } }),
        song("クローバー♣クラブ", Type.STANDARD, [4, 7.7, 9.7, 13.3], { intl: false }),
        song("妄想税", Type.STANDARD, [5, 8, 10.7, 12], { intl: false }),
        song("ウミユリ海底譚", Type.STANDARD, [4, 8.2, 9.7, 13.4], { intl: { levels: [4, 7.5, 9.7, 13.4] } }),
        song("若い力 -SEGA HARD GIRLS MIX-", Type.STANDARD, [5, 7.8, 10, 12.7], { intl: { levels: [5, 7.1, 10, 12.7] } }),
        song("Oshama Scramble!", Type.STANDARD, [6, 9.3, 11.9, 14.5], { intl: { levels: [6, 8.6, 11.9, 14.5] } }),
        song("D✪N’T  ST✪P  R✪CKIN’", Type.STANDARD, [6, 8.8, 11.9, 13.8], { intl: { levels: [6, 8.1, 11.9, 13.8] } }),
        song("ガラテアの螺旋", Type.STANDARD, [6, 9.5, 13.3, 14.6], { intl: { levels: [6, 8.8, 13.3, 14.6] } }),
        song("六兆年と一夜物語", Type.STANDARD, [5, 8.5, 10.7, 13.8], { intl: { levels: [5, 7.8, 10.7, 13.8] } }),
        song("Sweet Devil", Type.STANDARD, [4, 8.1, 11.5, 12.7], { intl: false }),
        song("東方スイーツ！～鬼畜姉妹と受難メイド～", Type.STANDARD, [5, 8.4, 10.7, 13.2], { intl: { levels: [5, 7.7, 10.7, 13.2] } }),
        song("どうしてこうなった", Type.STANDARD, [5, 8.5, 11.7, 13.7], { intl: { levels: [5, 7.8, 11.7, 13.7] } }),
        song("どういうことなの！？", Type.STANDARD, [5, 8.7, 11.3, 13.4], { intl: false }),
        song("キャプテン・ムラサのケツアンカー", Type.STANDARD, [6, 8.1, 11.5, 13.4], { intl: { levels: [6, 7.4, 11.5, 13.4] } }),
        song("Change Our MIRAI！", Type.STANDARD, [4, 8.7, 11, 13.4], { intl: { levels: [4, 8, 11, 13.4] } }),
        song("デッドレッドガールズ", Type.STANDARD, [4, 9.3, 10.9, 13.8], { intl: { levels: [4, 8.6, 10.9, 13.8] } }),
        song("ストリーミングハート", Type.STANDARD, [3, 8.7, 10.7, 13.3], { intl: { levels: [3, 8, 10.7, 13.3] } }),
        song("LANCE", Type.STANDARD, [5, 9.4, 11.7, 13.8], { intl: { levels: [5, 8.7, 11.7, 13.8] } }),
        song("Aiolos", Type.STANDARD, [6, 9.5, 12.7, 14.3], { intl: { levels: [6, 8.8, 12.7, 14.3] } }),
        song("Yet Another ”drizzly rain”", Type.STANDARD, [4, 8.3, 10.4, 12.6], { intl: { levels: [4, 7.6, 10.4, 12.6] } }),
        song("四次元跳躍機関", Type.STANDARD, [3, 7.7, 10.8, 13.4], { intl: { levels: [3, 7, 10.8, 13.4] } }),
        song("最終鬼畜妹・一部声", Type.STANDARD, [6, 9, 11.9, 13.9], { intl: { levels: [6, 8.3, 11.9, 13.9] } }),
        song("Axeria", Type.STANDARD, [6, 9.3, 12.9, 14.5], { intl: { levels: [6, 8.6, 12.9, 14.5] } }),
    ],
});
