import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card.tsx";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-background p-6">
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <CardTitle className="text-2xl">saltbot</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                    <div>Hello! The homepage of saltbot is currently under construction!</div>
                </CardContent>
            </Card>
        </main>
    );
}
