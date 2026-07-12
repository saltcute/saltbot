import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type * as React from "react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { getCurrentUser, linkCredentials } from "#/server/functions.ts";

type Tracker = "gcm-net" | "gcm-net-intl";
type Service = "maimaidx" | "chunithm" | "ongeki";

const TRACKER_NAME: Record<Tracker, Record<Service, string>> = {
    "gcm-net": {
        maimaidx: "maimaiでらっくすNET",
        chunithm: "CHUNITHM-NET",
        ongeki: "オンゲキ-NET",
    },
    "gcm-net-intl": {
        maimaidx: "maimai DX NET",
        chunithm: "CHUNITHM-NET (Intl. ver.)",
        ongeki: "オンゲキ-NET",
    },
};
const COMMAND_NAME: Record<Service, string> = {
    maimaidx: "mai",
    chunithm: "chu",
    ongeki: "geki",
};
const GAME_NAME: Record<Service, string> = {
    maimaidx: "maimai DX",
    chunithm: "CHUNITHM",
    ongeki: "O.N.G.E.K.I.",
};

export const Route = createFileRoute("/link")({
    validateSearch: (search: Record<string, unknown>): { tracker: Tracker; service: Service } => ({
        tracker: (() => {
            if (search.service === "ongeki") return "gcm-net";
            else return search.tracker === "gcm-net-intl" ? "gcm-net-intl" : "gcm-net";
        })(),
        service: (() => {
            if (search.service === "chunithm") return "chunithm";
            else if (search.service === "ongeki") return "ongeki";
            else return "maimaidx";
        })(),
    }),
    loader: async () => {
        const user = await getCurrentUser();
        return { user };
    },
    component: LinkPage,
});

function LinkPage() {
    const { user } = Route.useLoaderData();
    const { tracker: initialTracker, service } = Route.useSearch();
    const link = useServerFn(linkCredentials);

    const [tracker, setTracker] = useState<Tracker>(initialTracker);
    const [segaId, setSegaId] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
    const [error, setError] = useState("");
    // Until React hydrates, submitting would fall back to a native GET form
    // submission, which replaces the query string (losing tracker/service and
    // leaking the password into the URL). Keep the button disabled until then.
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);

    const displayName = TRACKER_NAME[tracker][service];

    async function onSubmit(event: React.SubmitEvent) {
        event.preventDefault();
        setStatus("saving");
        setError("");
        try {
            await link({ data: { tracker, segaId, password } });
            setStatus("done");
            setPassword("");
        } catch (err) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
    }

    return (
        <main className="flex min-h-svh items-start justify-center bg-background p-6 sm:items-center">
            {user ? (
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Link {displayName}</CardTitle>
                        <CardDescription>
                            Logged in as <span className="font-medium text-foreground">{user.name}</span>.{" "}
                            <a href="/api/auth/logout" className="underline underline-offset-4 hover:text-foreground">
                                Not you?
                            </a>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-6">
                        {service !== "ongeki" && (
                            <div className="inline-flex w-full rounded-4xl border border-border bg-input/30 p-1">
                                {(["gcm-net", "gcm-net-intl"] as const).map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setTracker(value)}
                                        data-active={tracker === value}
                                        className="flex-1 rounded-4xl px-3 py-1.5 text-sm font-medium transition-colors data-[active=false]:text-muted-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                                    >
                                        {TRACKER_NAME[value][service]}
                                    </button>
                                ))}
                            </div>
                        )}

                        <Alert variant="destructive">
                            <AlertTitle>Before you link, please read the following information:</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4">
                                    <li>
                                        Your Sega ID and <strong>password</strong> are required.
                                    </li>
                                    {tracker === "gcm-net-intl" && (
                                        <li>
                                            You must use a Sega ID to log into your account. Partner login like X (Twitter) or Facebook login will not
                                            work.
                                        </li>
                                    )}
                                    <li>
                                        Despite the unlikely event, saltbot is not responsible if your Sega ID become restricted or banned by Sega.
                                    </li>
                                    <li>You are generally discouraged from providing your password to any person.</li>
                                    <li>
                                        We make our best effort to keep your information secure. However, make sure to create a unique password for
                                        this service to reduce the risk of cyberattacks.
                                    </li>
                                    <li>
                                        By using this service, you agree to have saltbot store your account and password for the purpose of fetching
                                        your best 50 scores only.
                                    </li>
                                    {(service === "chunithm" || service === "ongeki") && tracker === "gcm-net" && (
                                        <li>
                                            You must subscribe to the {TRACKER_NAME[tracker][service]} standard course (スタンダードコース) in order
                                            to use this service. To learn more about スタンダードコース, visit{" "}
                                            <a href={`https://otogame-net.com/${service}/#${service}net`}>Sega’s website</a>
                                        </li>
                                    )}
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {status === "done" ? (
                            <Alert>
                                <AlertTitle>Linked successfully</AlertTitle>
                                <AlertDescription>
                                    Your {displayName} account has been linked. You can now use{" "}
                                    <code>
                                        /{COMMAND_NAME[service]} b50 {tracker}
                                    </code>{" "}
                                    on Discord. It is now safe to close this page.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="segaId">Sega ID</Label>
                                    <Input
                                        id="segaId"
                                        name="segaId"
                                        autoComplete="username"
                                        placeholder="Your Sega ID"
                                        value={segaId}
                                        onChange={(e) => setSegaId(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="Your Sega ID password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {status === "error" && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {error}
                                    </p>
                                )}

                                <Button type="submit" size="lg" className="w-full" disabled={!hydrated || status === "saving"}>
                                    {status === "saving" ? "Linking…" : "Link account"}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter>
                        <p className="text-xs text-muted-foreground">Your credentials are only used to fetch your scores.</p>
                    </CardFooter>
                </Card>
            ) : (
                <Card className="w-full max-w-md">
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-2xl">Link your {GAME_NAME[service]} account</CardTitle>
                        <CardDescription>
                            Connect your{" "}
                            {[...new Set((["gcm-net", "gcm-net-intl"] as const).map((value) => TRACKER_NAME[value][service]))].join(" / ")} account to
                            saltbot.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="w-full">
                            <a href={`/api/auth/discord?tracker=${tracker}&service=${service}`}>Login with Discord</a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}
