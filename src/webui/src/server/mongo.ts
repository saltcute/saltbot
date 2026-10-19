import { type Collection, MongoClient } from "mongodb";
import { type GcmTracker, getConfig } from "#/server/config.ts";

/**
 * Direct MongoDB access for linked credentials. Shares the `connections`
 * collection with the bot (src/bot/core/connections.ts): one document per
 * Discord user, with tracker links under `links.<tracker>`. Connection details
 * come from the same `config.json5` (see `config.ts`).
 */
interface UserConnections {
    _id: string;
    links?: Partial<Record<GcmTracker, string>>;
    updatedAt: Date;
}

let collectionPromise: Promise<Collection<UserConnections>> | undefined;

function getCollection(): Promise<Collection<UserConnections>> {
    if (!collectionPromise) {
        const client = new MongoClient(getConfig("database::mongo.connectionString"));
        const databaseName = getConfig("database::mongo.databaseName");
        collectionPromise = client.connect().then((c) => c.db(databaseName).collection<UserConnections>("connections"));
    }
    return collectionPromise;
}

/** Persist an encrypted gcm-net credential token under the user's Discord id. */
export async function saveLink(tracker: GcmTracker, discordUserId: string, token: string): Promise<void> {
    const collection = await getCollection();
    await collection.updateOne({ _id: discordUserId }, { $set: { [`links.${tracker}`]: token, updatedAt: new Date() } }, { upsert: true });
}

/** Read back a stored credential token (used to show "already linked" status). */
export async function getLink(tracker: GcmTracker, discordUserId: string): Promise<string | undefined> {
    const collection = await getCollection();
    const document = await collection.findOne({ _id: discordUserId });
    return document?.links?.[tracker] || undefined;
}
