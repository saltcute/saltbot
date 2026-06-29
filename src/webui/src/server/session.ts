import crypto from "node:crypto";
import { type GcmTracker, getConfig } from "#/server/kasumi.ts";

/**
 * Stateless, HMAC-signed cookie helpers (no database, no extra dependency).
 * The session cookie carries the authenticated Discord identity; the state
 * cookie carries the one-shot OAuth CSRF token + selected tracker.
 */

export const SESSION_COOKIE = "session";
export const OAUTH_STATE_COOKIE = "oauth_state";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function secret(): string {
    const value = getConfig("webui::config.sessionSecret");
    if (!value) throw new Error("webui::config.sessionSecret is not configured");
    return value;
}

function sign(value: string): string {
    return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function seal(payload: object): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${body}.${sign(body)}`;
}

function unseal<T>(token: string | undefined | null): T | null {
    if (!token) return null;
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = sign(body);
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    try {
        return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    } catch {
        return null;
    }
}

export interface SessionPayload {
    uid: string;
    name: string;
    avatar?: string;
    exp: number;
}

export function createSessionToken(user: { uid: string; name: string; avatar?: string }): string {
    return seal({ ...user, exp: Date.now() + SESSION_TTL_MS } satisfies SessionPayload);
}

export function readSession(token: string | undefined | null): SessionPayload | null {
    const payload = unseal<SessionPayload>(token);
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
}

interface StatePayload {
    state: string;
    tracker: GcmTracker;
    exp: number;
}

export function createStateToken(state: string, tracker: GcmTracker): string {
    return seal({ state, tracker, exp: Date.now() + STATE_TTL_MS } satisfies StatePayload);
}

export function readState(token: string | undefined | null): { state: string; tracker: GcmTracker } | null {
    const payload = unseal<StatePayload>(token);
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { state: payload.state, tracker: payload.tracker };
}
