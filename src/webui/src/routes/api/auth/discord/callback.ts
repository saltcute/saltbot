import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { avatarUrl, baseUrl, exchangeCode, fetchUser } from "#/server/discord-oauth.ts";
import { createSessionToken, OAUTH_STATE_COOKIE, readState, SESSION_COOKIE } from "#/server/session.ts";

export const Route = createFileRoute("/api/auth/discord/callback")({
    server: {
        handlers: {
            // biome-ignore lint/style/useNamingConvention: HTTP method handler key
            GET: async ({ request }) => {
                const url = new URL(request.url);
                const code = url.searchParams.get("code");
                const returnedState = url.searchParams.get("state");

                const stored = readState(getCookie(OAUTH_STATE_COOKIE));
                deleteCookie(OAUTH_STATE_COOKIE, { path: "/" });

                if (!code || !returnedState || !stored || stored.state !== returnedState) {
                    return new Response("Invalid or expired OAuth state. Please try again.", { status: 400 });
                }

                const accessToken = await exchangeCode(code);
                const user = await fetchUser(accessToken);

                setCookie(
                    SESSION_COOKIE,
                    createSessionToken({
                        uid: user.id,
                        name: user.global_name || user.username,
                        avatar: avatarUrl(user),
                    }),
                    {
                        httpOnly: true,
                        secure: url.protocol === "https:",
                        sameSite: "lax",
                        path: "/",
                        maxAge: 7 * 24 * 60 * 60,
                    },
                );

                return new Response(null, {
                    status: 302,
                    // biome-ignore lint/style/useNamingConvention: HTTP header name
                    headers: { Location: `${baseUrl()}/link?tracker=${stored.tracker}` },
                });
            },
        },
    },
});
