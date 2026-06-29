import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie } from "@tanstack/react-start/server";
import { baseUrl } from "#/server/discord-oauth.ts";
import { SESSION_COOKIE } from "#/server/session.ts";

export const Route = createFileRoute("/api/auth/logout")({
    server: {
        handlers: {
            // biome-ignore lint/style/useNamingConvention: HTTP method handler key
            GET: async () => {
                deleteCookie(SESSION_COOKIE, { path: "/" });
                return new Response(null, {
                    status: 302,
                    // biome-ignore lint/style/useNamingConvention: HTTP header name
                    headers: { Location: `${baseUrl()}/` },
                });
            },
        },
    },
});
