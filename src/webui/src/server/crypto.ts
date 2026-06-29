import { Crypto } from "maidraw-gcm-net-adapter/common";

/**
 * Lazily initialised PGP crypto, mirroring the bot's modal handler. `Crypto.new()`
 * reads (or, on first run, generates) the keypair persisted at
 * `~/.config/maidraw/gcm-net-adapter/pgpkey/`. Because the webui runs on the same
 * host as the bot, credentials encrypted here are decryptable by the bot.
 */
let instance: Crypto | undefined;

async function getCrypto(): Promise<Crypto> {
    if (!instance) instance = await Crypto.new();
    return instance;
}

/** Encrypt `{ segaId, password }` into the armored token stored in the database. */
export async function encryptCredentials(segaId: string, password: string): Promise<string> {
    const crypto = await getCrypto();
    const encrypted = await crypto.encrypt({ segaId, password });
    return encrypted as unknown as string;
}
