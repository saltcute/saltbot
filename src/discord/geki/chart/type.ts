export namespace Ongeki {
    export enum EDifficulty {
        BASIC,
        ADVANCED,
        EXPERT,
        MASTER,
        LUNATIC,
    }

    export interface IChart {
        /**
         * Unique Chart ID, i.e. a 4 digit number-like string.
         */
        id: number;
        /**
         * Name of the song.
         */
        name: string;
        /**
         * Name of the artist.
         */
        artist: string;
        /**
         * BPM of the song.
         */
        bpms: number[];
        /**
         * Difficulty category of the chart.
         */
        difficulty: EDifficulty;
        addVersion: IVersion;
        /**
         * Metadata of the chart.
         */
        meta: {
            /**
             * Note count of the chart.
             */
            notes: {
                tap: number;
                hold: number;
                side: number;
                flick: number;
                bell: number;
            };
            maxPlatinumScore: number;
            boss: {
                card: {
                    id: number;
                    name: string;
                };
                character: {
                    rarity: string;
                    name: string;
                    comment?: string;
                };
                level: number;
            };
        };
        /**
         * Events that happened to the chart in versions.
         */
        events: Events[];
        designer: string;
    }
    export namespace Events {
        interface Base {
            type: string;
            data?: any;
            version: IEventVersion;
        }
        export interface Existence extends Base {
            type: "existence";
            data: {
                level: number;
            };
        }
        export interface Absence extends Base {
            type: "absence";
        }
        export interface Removal extends Base {
            type: "removal";
        }
    }
    export type Events = Events.Existence | Events.Absence | Events.Removal;
    export interface IVersion {
        /**
         * Full name of the version.
         * @example "オンゲキ Re:Fresh"
         */
        name: string;
        /**
         * Version number as it is used internally.
         * Formatted as `{major}.{minor}.{patch}`.
         */
        gameVersion: {
            major: number;
            minor: number;
            release?: number;
        };
    }
    export interface IEventVersion extends IVersion {
        gameVersion: {
            major: number;
            minor: number;
            release: number;
        };
        region: "JPN";
    }

    export enum EBloodType {
        A = "A",
        B = "B",
        O = "O",
        AB = "AB",
    }
    export interface ICharacter {
        id: number;
        name: string;
        voiceLines: string[];
        bloodType: EBloodType;
        personality?: string;
        height: number;
    }
    export interface ICard {
        id: number;
        name: string;
        rarity: string;
        characterId: number;
        attribute: string;
    }
}