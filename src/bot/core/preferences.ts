import type { Collection } from "mongodb";
import { getDatabase } from "@/bot/core/database";

export type Game = "mai" | "chu" | "geki";
export type PreferenceValue = string | boolean;
export type CommandPreferences = Partial<Record<string, PreferenceValue>>;

/**
 * Where a set of saved defaults lives: one command of a game, optionally narrowed
 * to one tracker for commands whose options differ per tracker (b50).
 */
export interface PreferenceScope {
    game: Game;
    command: string;
    tracker?: string;
}

/**
 * Defaults a user saved for the optional arguments of commands, one document per user.
 * Stored as `<game>.<command>[.<tracker>].<option>`, e.g. `mai.b50.kamai.theme`.
 */
export interface UserPreferences {
    _id: string;
    mai?: Record<string, unknown>;
    chu?: Record<string, unknown>;
    geki?: Record<string, unknown>;
    updatedAt: Date;
}

export const PREFERENCES_COLLECTION = "preferences";

function collection(): Collection<UserPreferences> {
    return getDatabase().collection<UserPreferences>(PREFERENCES_COLLECTION);
}

function scopePath(scope: PreferenceScope): string {
    return [scope.game, scope.command, scope.tracker].filter(Boolean).join(".");
}

export class Preferences {
    static async get(discordUserId: string, scope: PreferenceScope): Promise<CommandPreferences> {
        const path = scopePath(scope);
        const document = await collection().findOne({ _id: discordUserId }, { projection: { [path]: 1 } });
        // biome-ignore lint/suspicious/noExplicitAny: walking a dynamic path
        let node: any = document;
        for (const key of path.split(".")) node = node?.[key];
        return node && typeof node === "object" ? node : {};
    }

    static async set(discordUserId: string, scope: PreferenceScope, option: string, value: PreferenceValue): Promise<void> {
        await collection().updateOne(
            { _id: discordUserId },
            { $set: { [`${scopePath(scope)}.${option}`]: value, updatedAt: new Date() } },
            { upsert: true },
        );
    }

    static async unset(discordUserId: string, scope: PreferenceScope, option: string): Promise<void> {
        await collection().updateOne({ _id: discordUserId }, { $unset: { [`${scopePath(scope)}.${option}`]: "" }, $set: { updatedAt: new Date() } });
    }

    /** Clear every saved default of a scope, or of a whole game when only `game` is given. */
    static async reset(discordUserId: string, scope: PreferenceScope | { game: Game }): Promise<void> {
        const path = "command" in scope ? scopePath(scope) : scope.game;
        await collection().updateOne({ _id: discordUserId }, { $unset: { [path]: "" }, $set: { updatedAt: new Date() } });
    }

    /** A saved string, if it is still one of the option's choices. */
    static pick(value: PreferenceValue | undefined, choices: readonly { value: string }[]): string | undefined {
        return typeof value === "string" && choices.some((choice) => choice.value === value) ? value : undefined;
    }

    static flag(value: PreferenceValue | undefined): boolean | undefined {
        return typeof value === "boolean" ? value : undefined;
    }
}
