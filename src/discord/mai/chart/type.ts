export namespace Maimai {
    export enum EDifficulty {
        BASIC,
        ADVANCED,
        EXPERT,
        MASTER,
        REMASTER,
        UTAGE,
    }
    export interface IChart {
        /**
         * Unique Chart ID, i.e. a 6 digit number-like string.
         * @example "001451" for Transcended Light standard. (Does not actually exist)
         * @example "011451" for Transcended Light DX.
         * @example "011804" for How To Make 音ゲ～曲！DX.
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
        bpm: number;
        /**
         * Difficulty category of the chart.
         */
        difficulty: EDifficulty;
        /**
         * Internal level of the chart as found in the latest version available.
         */
        level: number;
        addVersion: {
            DX?: IVersion;
            EX?: IVersion;
            CN?: IVersion;
        };
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
                slide: number;
                touch: number;
                break: number;
            };
            maxDXScore: number;
        };
        /**
         * Events that happened to the chart in versions.
         */
        events: Events[];
        designer: {
            id: number;
            name: string;
        };
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
         * @example "maimai でらっくす PRiSM PLUS"
         */
        name: string;
        /**
         * Version number as it is used internally.
         * Formatted as `{major}.{minor}.{patch}`.
         *
         * @example "1.55.0" for "1.55"
         * @example "1.41.7" for "1.41-G"
         */
        gameVersion: {
            isDX: boolean;
            major: number;
            minor: number;
            release?: number;
        };
    }
    export interface IEventVersion extends IVersion {
        gameVersion: {
            isDX: boolean;
            major: number;
            minor: number;
            release: number;
        };
        region: "DX" | "EX" | "CN";
    }
}
