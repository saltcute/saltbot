import type { Collection } from "mongodb";
import { getDatabase } from "@/bot/core/database";

export type Trackers = "kamai" | "divingfish" | "lxns" | "lxns-chuni" | "maishift" | "gcm-net" | "gcm-net-intl";

/**
 * Tracker accounts linked to a Discord user, one document per user.
 * `links` holds the tracker username / friend code, or the encrypted
 * credential token for gcm-net trackers (written by the webui).
 * `ignored` records trackers the user asked not to be prompted to link again.
 */
export interface UserConnections {
    _id: string;
    links?: Partial<Record<Trackers, string>>;
    ignored?: Partial<Record<Trackers, boolean>>;
    updatedAt: Date;
}

export const CONNECTIONS_COLLECTION = "connections";

function collection(): Collection<UserConnections> {
    return getDatabase().collection<UserConnections>(CONNECTIONS_COLLECTION);
}

export class Connections {
    /** Fetch every link and ignore flag of a user in one read. */
    static async get(discordUserId: string): Promise<UserConnections | null> {
        return collection().findOne({ _id: discordUserId });
    }

    static async getLink(discordUserId: string, tracker: Trackers): Promise<string | undefined> {
        const document = await collection().findOne({ _id: discordUserId }, { projection: { [`links.${tracker}`]: 1 } });
        return document?.links?.[tracker] || undefined;
    }

    static async setLink(discordUserId: string, tracker: Trackers, value: string): Promise<void> {
        await collection().updateOne({ _id: discordUserId }, { $set: { [`links.${tracker}`]: value, updatedAt: new Date() } }, { upsert: true });
    }

    static async removeLink(discordUserId: string, tracker: Trackers): Promise<void> {
        await collection().updateOne({ _id: discordUserId }, { $unset: { [`links.${tracker}`]: "" }, $set: { updatedAt: new Date() } });
    }

    static async setIgnored(discordUserId: string, tracker: Trackers): Promise<void> {
        await collection().updateOne({ _id: discordUserId }, { $set: { [`ignored.${tracker}`]: true, updatedAt: new Date() } }, { upsert: true });
    }
}
