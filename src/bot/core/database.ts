import { logger } from "@saltcute/logger";
import { type Db, MongoClient } from "mongodb";
import { getConfig } from "@/bot/core/config";

let client: MongoClient | undefined;
let database: Db | undefined;

/**
 * Connect the shared MongoDB client. Must be awaited before anything calls
 * `getDatabase()`.
 */
export async function connectDatabase(): Promise<void> {
    if (database) return;
    const connectionString = getConfig("database::mongo.connectionString");
    const databaseName = getConfig("database::mongo.databaseName");
    if (!connectionString || !databaseName) {
        throw new Error("database::mongo.connectionString and database::mongo.databaseName must be set in the config");
    }
    client = new MongoClient(connectionString);
    await client.connect();
    database = client.db(databaseName);
    logger.info(`Connected to MongoDB database ${databaseName}.`);
}

export function getDatabase(): Db {
    if (!database) throw new Error("MongoDB is not connected yet");
    return database;
}

export async function closeDatabase(): Promise<void> {
    await client?.close();
    client = undefined;
    database = undefined;
}
