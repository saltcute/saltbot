export type Trackers = "kamai" | "divingfish" | "lxns" | "lxns-chuni" | "maishift" | "gcm-net" | "gcm-net-ex";

export interface CustomStorage {
    // add your custom storage properties here
    "maimai::lxns.token": string;
    "maimai::divingFish.token": string;

    "maimai::config.useLocalDatabase": boolean;
    "maimai::config.localDatabasePath": string;

    "maimai::config.useLocalOtogedbDatabase": boolean;
    "maimai::config.otogedbDatabasePath": string;

    "discord::auth.clientId": string;
    "discord::auth.token": string;

    [k: `salt::connection.discord.${Trackers}.${string}`]: string | undefined;
    [k: `salt::connection.discord.ignore.${Trackers}.${string}`]: boolean | undefined;
}
