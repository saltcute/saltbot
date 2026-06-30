import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { encryptCredentials } from "#/server/crypto.ts";
import { type GcmTracker, getLink, saveLink } from "#/server/kasumi.ts";
import { readSession, SESSION_COOKIE } from "#/server/session.ts";

export interface CurrentUser {
    uid: string;
    name: string;
    avatar?: string;
}

/** Read the authenticated Discord identity from the signed session cookie. */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(async (): Promise<CurrentUser | null> => {
    const session = readSession(getCookie(SESSION_COOKIE));
    if (!session) return null;
    return { uid: session.uid, name: session.name, avatar: session.avatar };
});

function normalizeTracker(value: unknown): GcmTracker {
    return value === "gcm-net-intl" ? "gcm-net-intl" : "gcm-net";
}

/** Whether the logged-in user already has a stored credential for the tracker. */
export const getLinkStatus = createServerFn({ method: "GET" })
    .validator((data: { tracker: unknown }) => ({ tracker: normalizeTracker(data?.tracker) }))
    .handler(async ({ data }): Promise<{ linked: boolean }> => {
        const session = readSession(getCookie(SESSION_COOKIE));
        if (!session) return { linked: false };
        const existing = await getLink(data.tracker, session.uid);
        return { linked: Boolean(existing) };
    });

/** Encrypt the Sega ID + password and persist them for the logged-in user. */
export const linkCredentials = createServerFn({ method: "POST" })
    .validator((data: { tracker: unknown; segaId: unknown; password: unknown }) => {
        const segaId = typeof data?.segaId === "string" ? data.segaId.trim() : "";
        const password = typeof data?.password === "string" ? data.password : "";
        if (!segaId || !password) throw new Error("Sega ID and password are required.");
        return { tracker: normalizeTracker(data?.tracker), segaId, password };
    })
    .handler(async ({ data }): Promise<{ ok: true }> => {
        const session = readSession(getCookie(SESSION_COOKIE));
        if (!session) throw new Error("You must be logged in with Discord to link an account.");
        const token = await encryptCredentials(data.segaId, data.password);
        saveLink(data.tracker, session.uid, token);
        return { ok: true };
    });
