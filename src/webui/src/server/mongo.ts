import { type Collection, MongoClient } from "mongodb";
import { type GcmTracker, getConfig } from "#/server/config.ts";

/**
 * Direct MongoDB access for linked credentials, replacing the Kasumi config
 * client the webui used to share with the bot. The on-disk schema is kept
 * identical to Kasumi's (`{ _id: <key>, content: <value> }`) so the bot keeps
 * reading credentials back via `kasumi.config.getOne`. Connection details come
 * from the same `config.json5` (see `config.ts`).
 */
interface ConfigDocument {
    _id: string;
    content: unknown;
}

let collectionPromise: Promise<Collection<ConfigDocument>> | undefined;

function getCollection(): Promise<Collection<ConfigDocument>> {
    if (!collectionPromise) {
        const client = new MongoClient(getConfig("kasumi::config.mongoConnectionString"));
        const databaseName = getConfig("kasumi::config.mongoDatabaseName");
        const collectionName = getConfig("kasumi::config.mongoCollectionName");
        collectionPromise = client.connect().then((c) => c.db(databaseName).collection<ConfigDocument>(collectionName));
    }
    return collectionPromise;
}

function linkKey(tracker: GcmTracker, discordUserId: string): string {
    return `salt::connection.discord.${tracker}.${discordUserId}`;
}

/** Persist an encrypted gcm-net credential token under the user's Discord id. */
export async function saveLink(tracker: GcmTracker, discordUserId: string, token: string): Promise<void> {
    const collection = await getCollection();
    await collection.updateOne({ _id: linkKey(tracker, discordUserId) }, { $set: { content: token } }, { upsert: true });
}

/** Read back a stored credential token (used to show "already linked" status). */
export async function getLink(tracker: GcmTracker, discordUserId: string): Promise<string | undefined> {
    const collection = await getCollection();
    const document = await collection.findOne({ _id: linkKey(tracker, discordUserId) });
    return document?.content as string | undefined;
}
