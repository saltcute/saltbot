import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { getAuthorizeUrl } from "#/server/discord-oauth.ts";
import { createStateToken, OAUTH_STATE_COOKIE } from "#/server/session.ts";

export const Route = createFileRoute("/api/auth/discord/")({
    server: {
        handlers: {
            // biome-ignore lint/style/useNamingConvention: HTTP method handler key
            GET: async ({ request }) => {
                const url = new URL(request.url);
                const tracker = url.searchParams.get("tracker") === "gcm-net-ex" ? "gcm-net-ex" : "gcm-net";
                const state = crypto.randomBytes(32).toString("base64url");

                setCookie(OAUTH_STATE_COOKIE, createStateToken(state, tracker), {
                    httpOnly: true,
                    secure: url.protocol === "https:",
                    sameSite: "lax",
                    path: "/",
                    maxAge: 600,
                });

                return new Response(null, {
                    status: 302,
                    // biome-ignore lint/style/useNamingConvention: HTTP header name
                    headers: { Location: getAuthorizeUrl(state) },
                });
            },
        },
    },
});
