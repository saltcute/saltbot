import { createFileRoute } from "@tanstack/react-router";

type Games = "maimai" | "maimaidx" | "chunithm" | "ongeki";

const REDIRECTS: Record<string, string | Partial<Record<Games, string>>> = {
    discord: "https://discord.gg/SahvVPNf4f",

    github: "https://github.com/saltcute/saltbot",

    support: "https://ko-fi.com/saltbot",
    donate: "https://ko-fi.com/saltbot",
    kohi: "https://ko-fi.com/saltbot",

    add: "https://discord.com/oauth2/authorize?client_id=1299571522771619861&scope=bot&permissions=2048",
    invite: "https://discord.com/oauth2/authorize?client_id=1299571522771619861&scope=bot&permissions=2048",

    guide: {
        maimaidx: "https://docs.google.com/document/d/1gQlxtxOj-E3H2SClJH5PNxLnG6eBufDFrw2yLsffbp0",
        chunithm: "https://chunithm.org",
        ongeki: "https://docs.google.com/document/d/1HKCW7DWjYRnVjCmPzrQwDKC0wKTi41X-Y-dP1-ygliU",
    },
};

export const Route = createFileRoute("/$slug")({
    server: {
        handlers: {
            // biome-ignore lint/style/useNamingConvention: HTTP method handler key
            GET: async ({ request, params }) => {
                const url = new URL(request.url);
                const hostname = url.hostname;

                const target = REDIRECTS[params.slug];
                if (!target) {
                    return new Response("Not found", { status: 404 });
                }
                if (typeof target === "string") {
                    return new Response(null, {
                        status: 302,
                        headers: { location: target },
                    });
                } else {
                    let currentGame: Games | undefined;
                    if (hostname.includes("maimaidx.cab")) {
                        currentGame = "maimaidx";
                    } else if (hostname.includes("maimai.cab")) {
                        currentGame = "maimai";
                    } else if (hostname.includes("chunithm.cab")) {
                        currentGame = "chunithm";
                    } else if (hostname.includes("ongeki.cab")) {
                        currentGame = "ongeki";
                    }
                    if (currentGame) {
                        const byHostnameTarget = target[currentGame];
                        if (byHostnameTarget) {
                            return new Response(null, {
                                status: 302,
                                headers: { location: byHostnameTarget },
                            });
                        }
                    }
                }
                return new Response("Not found", { status: 404 });
            },
        },
    },
});
