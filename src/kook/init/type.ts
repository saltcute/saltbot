export interface CustomStorage {
    // add your custom storage properties here
    "maimai::lxns.token": string;
    "maimai::divingFish.token": string;

    "maimai::config.useLocalDatabase": boolean;
    "maimai::config.localDatabasePath": string;

    "discord::auth.clientId": string;
    "discord::auth.token": string;

    [
        k: `salt::connection.discord.${"kamai" | "divingfish" | "lxns"}.${string}`
    ]: string | undefined;
    [
        k: `salt::connection.discord.ignore.${"kamai" | "divingfish" | "lxns"}.${string}`
    ]: boolean | undefined;
}
