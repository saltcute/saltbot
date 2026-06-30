import { getConfig } from "#/server/config.ts";

const DISCORD_API = "https://discord.com/api";

export function baseUrl(): string {
    return (getConfig("webui::config.baseUrl") || "").replace(/\/+$/, "");
}

export function redirectUri(): string {
    return `${baseUrl()}/api/auth/discord/callback`;
}

export function getAuthorizeUrl(state: string): string {
    // Tuple form keeps the snake_case OAuth parameter names out of object-literal
    // property positions (they are dictated by the Discord OAuth2 spec).
    const params = new URLSearchParams([
        ["client_id", getConfig("discord::auth.clientId")],
        ["response_type", "code"],
        ["scope", "identify"],
        ["redirect_uri", redirectUri()],
        ["state", state],
        ["prompt", "consent"],
    ]);
    return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<string> {
    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams([
            ["client_id", getConfig("discord::auth.clientId")],
            ["client_secret", getConfig("discord::auth.clientSecret")],
            ["grant_type", "authorization_code"],
            ["code", code],
            ["redirect_uri", redirectUri()],
        ]).toString(),
    });
    if (!res.ok) throw new Error(`Discord token exchange failed (${res.status})`);
    // biome-ignore lint/style/useNamingConvention: Discord API response field
    const json = (await res.json()) as { access_token: string };
    return json.access_token;
}

export interface DiscordUser {
    id: string;
    username: string;
    // biome-ignore lint/style/useNamingConvention: Discord API response field
    global_name?: string | null;
    avatar?: string | null;
}

export async function fetchUser(accessToken: string): Promise<DiscordUser> {
    const res = await fetch(`${DISCORD_API}/users/@me`, {
        // biome-ignore lint/style/useNamingConvention: HTTP header name
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Discord user fetch failed (${res.status})`);
    return (await res.json()) as DiscordUser;
}

export function avatarUrl(user: DiscordUser): string | undefined {
    return user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined;
}
