import { Type } from "gcm-database/maimai";
import { song, versionFolders } from "../../helpers";

/**
 * Charts are in the version their region of the game says, so Japan and International differ in a few songs.
 * Japan uses its internal levels, and International overrides them where they differ. Utage and Re:MASTER charts are left out,
 * as only BASIC to MASTER count towards the plate.
 */
export default versionFolders({
    id: "version-orange",
    version: "ORANGE",
    title: "maimai ORANGE",
    plate: "橙",
    goals: ["sss", "fc", "ap", "fdx"],
    songs: [
        // Listed in 橙除外曲 in International, so it does not count towards the 橙 plate there. It still counts in Japan.
        song("ダブルラリアット", Type.STANDARD, [5, 7.3, 10.9, 13.2], { intl: false }),
        song("緋色のDance", Type.STANDARD, [5, 8.3, 10.7, 13.3], { intl: { levels: [5, 7.6, 10.7, 13.3] } }),
        song("明星ロケット", Type.STANDARD, [5, 8.3, 10, 12.5], { intl: { levels: [5, 7.6, 10, 12.5] } }),
        song("MIRROR of MAGIC", Type.STANDARD, [5, 8.5, 10.7, 13.2], { intl: { levels: [5, 7.8, 10.7, 13.2] } }),
        song("One Step Ahead", Type.STANDARD, [6, 8.2, 11.2, 12.7], { intl: { levels: [6, 7.5, 11.2, 12.7] } }),
        song("B.B.K.K.B.K.K.", Type.STANDARD, [6, 9.5, 12.7, 14], { intl: { levels: [6, 8.8, 12.7, 14] } }),
        song("おこちゃま戦争", Type.STANDARD, [6, 8, 10.8, 13.3], { intl: { levels: [6, 7.3, 10.8, 13.3] } }),
        song("Link", Type.STANDARD, [6, 8.9, 10.7, 12.5], {
            intl: { levels: [6, 8.2, 10.7, 12.5] },
            ids: { local: "383", otogedb: "522", otogedbIntl: "522" },
        }),
        song("Dreampainter", Type.STANDARD, [4, 8.5, 11.1, 12.9], { intl: { levels: [4, 7.8, 11.1, 12.9] } }),
        song("The Great Journey", Type.STANDARD, [6, 7.5, 10.5, 11.9], { intl: { levels: [6, 6.8, 10.5, 11.9] } }),
        song("きたさいたま2000", Type.STANDARD, [5, 9.3, 13.3, 14.2], { intl: { levels: [5, 8.6, 13.3, 14.2] } }),
        song("FLOWER", Type.STANDARD, [6, 9, 11.9, 13.9], { intl: { levels: [6, 8.3, 11.9, 13.9] } }),
        song("Got more raves？", Type.STANDARD, [6, 9.5, 12.8, 14.1], { intl: { levels: [6, 8.8, 12.8, 14.1] } }),
        song("shake it!", Type.STANDARD, [5, 8.3, 9, 12.5], { intl: { levels: [5, 7.6, 9, 12.5] } }),
        song("BETTER CHOICE", Type.STANDARD, [4, 9, 10.8, 12.9], { intl: { levels: [4, 8.3, 10.8, 12.9] } }),
        song("VERTeX", Type.STANDARD, [5, 9.5, 11.9, 14.7], { intl: { levels: [5, 8.8, 11.9, 14.7] } }),
        song("Ignis Danse", Type.STANDARD, [5, 9, 13, 14.5], { intl: { levels: [5, 8.3, 13, 14.5] } }),
        song("Scars of FAUNA", Type.STANDARD, [4, 8.5, 11.2, 13.8], { intl: { levels: [4, 7.8, 11.2, 13.8] } }),
        song("FUJIN Rumble", Type.STANDARD, [5, 9.3, 11.9, 14.5], { intl: { levels: [5, 8.6, 11.9, 14.5] } }),
        song("アンハッピーリフレイン", Type.STANDARD, [5, 9, 11.8, 13.4], { intl: { levels: [5, 8.3, 11.8, 13.4] } }),
        song("planet dancer", Type.STANDARD, [4, 8.5, 11.2, 13.2], { intl: { levels: [4, 7.8, 11.2, 13.2] } }),
        song("Cosmic Magic Shooter", Type.STANDARD, [5, 8.5, 10.8, 13.9], { intl: { levels: [5, 7.8, 10.8, 13.9] } }),
        song("ピーマンたべたら", Type.STANDARD, [5, 8.3, 11.4, 13.7], { intl: { levels: [5, 7.6, 11.4, 13.7] } }),
        song("究極焼肉レストラン！お燐の地獄亭！", Type.STANDARD, [6, 8, 10.7, 12.7], { intl: { levels: [6, 7.3, 10.7, 12.7] } }),
        song("Heart Beats", Type.STANDARD, [4, 8.2, 9.8, 12.4], { intl: { levels: [4, 7.5, 9.8, 12.4] } }),
        song("oboro", Type.STANDARD, [6, 9.1, 12, 13.7], { intl: { levels: [6, 8.4, 12, 13.7] } }),
        song("Dragoon", Type.STANDARD, [5, 9.3, 10.9, 13.4], { intl: { levels: [5, 8.6, 10.9, 13.4] } }),
        song("不毛！", Type.STANDARD, [3, 8.8, 10.1, 12.7], { intl: { levels: [3, 8.1, 10.1, 12.7] } }),
        song("おても☆Yan", Type.STANDARD, [4, 7.5, 10.5, 13], { intl: { levels: [4, 6.8, 10.5, 13] } }),
        song("Caliburne ～Story of the Legendary sword～", Type.STANDARD, [5, 9.9, 12.9, 14.3], { intl: { levels: [5, 9.4, 12.9, 14.3] } }),
    ],
});
