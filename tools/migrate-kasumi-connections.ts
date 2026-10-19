/**
 * Migrate tracker links from the old Kasumi key-value collection
 * (`{ _id: "salt::connection.discord.<tracker>.<uid>", content }`) into the
 * per-user `connections` collection (see src/bot/core/connections.ts).
 *
 * Usage:
 *   node -r ts-node/register -r tsconfig-paths/register tools/migrate-kasumi-connections.ts \
 *       --source-collection <name> [--source-db <db>] [--target-db <db>] [--dry-run] [--cleanup-secrets]
 *
 * --source-db / --target-db default to `database::mongo.databaseName`.
 * Existing values in `connections` are never overwritten, so it is safe to re-run.
 * --cleanup-secrets deletes the config entries (tokens, secrets) Kasumi copied
 * into the source collection. Nothing else in the source collection is touched.
 */
import { type AnyBulkWriteOperation, MongoClient } from "mongodb";
import { getConfig } from "@/bot/core/config";
import { CONNECTIONS_COLLECTION, type UserConnections } from "@/bot/core/connections";

const PREFIX = "salt::connection.discord.";
const SECRET_PREFIXES = ["kasumi::", "discord::", "webui::", "maimai::"];

function getArg(name: string): string | undefined {
    const index = process.argv.indexOf(`--${name}`);
    return index === -1 ? undefined : process.argv[index + 1];
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

interface Pending {
    links: Record<string, string>;
    ignored: Record<string, boolean>;
}

(async () => {
    const sourceCollectionName = getArg("source-collection");
    if (!sourceCollectionName) throw new Error("--source-collection is required");
    const sourceDbName = getArg("source-db") || getConfig("database::mongo.databaseName");
    const targetDbName = getArg("target-db") || getConfig("database::mongo.databaseName");
    const dryRun = hasFlag("dry-run");

    const client = new MongoClient(getConfig("database::mongo.connectionString"));
    await client.connect();
    try {
        const source = client.db(sourceDbName).collection<{ _id: string; content: unknown }>(sourceCollectionName);
        const target = client.db(targetDbName).collection<UserConnections>(CONNECTIONS_COLLECTION);

        const users = new Map<string, Pending>();
        const counts: Record<string, number> = {};
        const skipped: string[] = [];
        for await (const document of source.find({ _id: { $regex: `^${PREFIX.replaceAll(".", "\\.")}` } })) {
            const parts = document._id.slice(PREFIX.length).split(".");
            const isIgnore = parts[0] === "ignore" && parts.length === 3;
            const [tracker, uid] = isIgnore ? parts.slice(1) : parts;
            if ((!isIgnore && parts.length !== 2) || !tracker || !uid) {
                skipped.push(`${document._id} (unrecognized key)`);
                continue;
            }
            const user = users.get(uid) ?? { links: {}, ignored: {} };
            if (isIgnore) {
                if (document.content !== true) {
                    skipped.push(`${document._id} (content ${JSON.stringify(document.content)})`);
                    continue;
                }
                user.ignored[tracker] = true;
            } else {
                if (typeof document.content !== "string" || !document.content) {
                    skipped.push(`${document._id} (content ${JSON.stringify(document.content)})`);
                    continue;
                }
                user.links[tracker] = document.content;
            }
            users.set(uid, user);
            const label = isIgnore ? `ignore.${tracker}` : tracker;
            counts[label] = (counts[label] ?? 0) + 1;
        }

        console.log(`Source: ${sourceDbName}.${sourceCollectionName} -> target: ${targetDbName}.${CONNECTIONS_COLLECTION}`);
        console.log(`Users: ${users.size}`);
        console.table(counts);
        if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);

        // Pipeline updates with $ifNull only fill fields that are not set yet,
        // so links written by the new code after go-live are never overwritten.
        const operations: AnyBulkWriteOperation<UserConnections>[] = [...users].map(([uid, user]) => {
            const set: Record<string, unknown> = { updatedAt: { $ifNull: ["$updatedAt", "$$NOW"] } };
            for (const [tracker, value] of Object.entries(user.links)) set[`links.${tracker}`] = { $ifNull: [`$links.${tracker}`, value] };
            for (const tracker of Object.keys(user.ignored)) set[`ignored.${tracker}`] = { $ifNull: [`$ignored.${tracker}`, true] };
            return { updateOne: { filter: { _id: uid }, update: [{ $set: set }], upsert: true } };
        });

        if (dryRun) {
            console.log("Dry run, nothing written.");
        } else if (operations.length) {
            const result = await target.bulkWrite(operations, { ordered: false });
            console.log(`Inserted ${result.upsertedCount} users, updated ${result.modifiedCount} users.`);
        }

        if (hasFlag("cleanup-secrets")) {
            const filter = { _id: { $regex: `^(${SECRET_PREFIXES.join("|")})` } };
            const secrets = await source.countDocuments(filter);
            if (dryRun) console.log(`Would delete ${secrets} config entries from the source collection.`);
            else console.log(`Deleted ${(await source.deleteMany(filter)).deletedCount} config entries from the source collection.`);
        }
    } finally {
        await client.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
