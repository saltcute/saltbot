
export namespace Chunithm {
    export enum EDifficulty {
        BASIC,
        ADVANCED,
        EXPERT,
        MASTER,
        ULTIMA,
        WORLDS_END,
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
         * BPM(s, if multiple) of the song.
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
                flick: number;
                air: number;
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
         * @example "CHUNITHM X-VERSE"
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
        region: "JPN" | "INT" | "CHN";
    }
}
