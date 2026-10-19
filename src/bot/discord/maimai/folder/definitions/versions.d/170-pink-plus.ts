import { Type } from "gcm-database/maimai";
import { song, versionFolders } from "../../helpers";

/**
 * Charts are in the version their region of the game says, so Japan and International differ in a few songs.
 * Japan uses its internal levels, and International overrides them where they differ. Utage and Re:MASTER charts are left out,
 * as only BASIC to MASTER count towards the plate.
 */
export default versionFolders({
    id: "version-pink-plus",
    version: "PiNK PLUS",
    title: "maimai PiNK PLUS",
    plate: "櫻",
    aliases: ["樱"],
    goals: ["sss", "fc", "ap", "fdx"],
    songs: [
        song("無敵We are one!!", Type.STANDARD, [5, 9.3, 10.1, 13.7], { intl: { levels: [5, 8.6, 10.1, 13.7] } }),
        song("儚きもの人間", Type.STANDARD, [5, 9.2, 10.9, 13.8], { intl: { levels: [5, 8.5, 10.9, 13.8] } }),
        song("fake!fake!", Type.STANDARD, [4, 8.5, 10.1, 12.9], { intl: { levels: [4, 7.8, 10.1, 12.9] } }),
        song("キミノヨゾラ哨戒班", Type.STANDARD, [5, 8.5, 10.8, 13], { intl: { levels: [5, 7.8, 10.8, 13] } }),
        song("恋愛裁判", Type.STANDARD, [4, 7.8, 10, 11.8], { intl: { levels: [4, 7.1, 10, 11.8] } }),
        song("Invitation", Type.STANDARD, [4, 8.3, 9.9, 13], { intl: { levels: [4, 7.6, 9.9, 13] } }),
        song("connecting with you", Type.STANDARD, [4, 8.9, 10.8, 13.2], { intl: { levels: [4, 8.2, 10.8, 13.2] } }),
        song("高気圧ねこロック", Type.STANDARD, [6, 9.5, 11.7, 13.8], { intl: { levels: [6, 8.8, 11.7, 13.8] } }),
        song("月に叢雲華に風", Type.STANDARD, [4, 8, 10, 13.2], { intl: { levels: [4, 7.3, 10, 13.2] } }),
        song("METATRON", Type.STANDARD, [6, 9.5, 12.8, 14.1], { intl: { levels: [6, 8.8, 12.8, 14.1] } }),
        song("パーフェクト生命", Type.STANDARD, [6, 8.8, 10.1, 13.4], { intl: { levels: [6, 8.1, 10.1, 13.4] } }),
        song("Contrapasso -paradiso-", Type.STANDARD, [6, 9.9, 13, 14.4], { intl: { levels: [6, 9.5, 13, 14.4] } }),
        song("Infantoon Fantasy", Type.STANDARD, [6, 9.3, 10.8, 13.8], { intl: { levels: [6, 8.6, 10.8, 13.8] } }),
        song("洗脳", Type.STANDARD, [4, 7.8, 10.7, 12.4], { intl: { levels: [4, 7.1, 10.7, 12.4] } }),
        song("東京リアルワールド", Type.STANDARD, [5, 8.2, 9.4, 10.8], { intl: { levels: [5, 7.5, 9.4, 10.8] } }),
        song("しんでしまうとはなさけない！", Type.STANDARD, [6, 8.5, 10.1, 12.9], { intl: false }),
        song("Jumble Rumble", Type.STANDARD, [6, 9.5, 12.9, 14], { intl: { levels: [6, 8.8, 12.9, 14] } }),
        // Listed in 櫻除外曲 in International, so it does not count towards the 櫻 plate there. It still counts in Japan.
        song("Hand in Hand", Type.STANDARD, [4, 7.5, 10.5, 12.8], { intl: false }),
        song("クノイチでも恋がしたい", Type.STANDARD, [6, 8.6, 11, 13.4], { intl: false }),
        song("Barbed Eye", Type.STANDARD, [5, 8.3, 10.8, 13], { intl: { levels: [5, 7.6, 10.8, 13] } }),
        song("Hyper Active", Type.STANDARD, [6, 9.8, 13.2, 13.9], { intl: { levels: [6, 9.1, 13.2, 13.9] } }),
        song("セハガガガンバッちゃう！！", Type.STANDARD, [6, 8.8, 11.5, 13.3], { intl: { levels: [6, 8.1, 11.5, 13.3] } }),
        song("brilliant better", Type.STANDARD, [5, 8.2, 11.7, 13.3], { intl: { levels: [5, 7.5, 11.7, 13.3] } }),
        song("No Routine", Type.STANDARD, [6, 8, 11, 13.4], { intl: { levels: [6, 7.3, 11, 13.4] } }),
        song("ひれ伏せ愚民どもっ！", Type.STANDARD, [5, 8.5, 10.7, 13.3], { intl: { levels: [5, 7.8, 10.7, 13.3] } }),
        song("エテルニタス・ルドロジー", Type.STANDARD, [5, 8.3, 11.3, 13.7], { intl: { levels: [5, 7.6, 11.3, 13.7] } }),
        song("Nitrous Fury", Type.STANDARD, [6, 9.2, 12, 14], { intl: { levels: [6, 8.5, 12, 14] } }),
        song("CITRUS MONSTER", Type.STANDARD, [7, 9.9, 12.9, 14.5], { intl: { levels: [7, 9.3, 12.9, 14.5] } }),
        song("ハート・ビート", Type.STANDARD, [6, 9, 10.8, 13.4], { intl: { levels: [6, 8.3, 10.8, 13.4] } }),
        song("終わりなき物語", Type.STANDARD, [5, 8.3, 10.9, 12.7], { intl: { levels: [5, 7.6, 10.9, 12.7] } }),
        song("AMAZING MIGHTYYYY!!!!", Type.STANDARD, [7.7, 10.4, 13.6, 14.7], { intl: { levels: [7.7, 9.8, 13.6, 14.7] } }),
        song("やめろ！聴くな！", Type.STANDARD, [6, 8.6, 10.1, 13.3], { intl: { levels: [6, 7.9, 10.1, 13.3] } }),
        song("木彫り鯰と右肩ゾンビ", Type.STANDARD, [6, 8.8, 10.8, 13.6], { intl: { levels: [6, 8.1, 10.8, 13.6] } }),
        song("ECHO", Type.STANDARD, [4, 8.3, 11.3, 13.5], { intl: { levels: [4, 7.6, 11.3, 13.5] } }),
        song("Prophesy One", Type.STANDARD, [7.7, 9.9, 12.4, 14.6], { intl: { levels: [7.7, 9.3, 12.4, 14.6] } }),
    ],
});
