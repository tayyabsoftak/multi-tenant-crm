import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Multi-tenant CRM</h1>
        <p className="text-sm text-muted-foreground">
          Continue to the app using the routes below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-4 border-border/80 bg-card p-6 text-card-foreground shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Sign in</p>
            <p className="font-mono text-xs text-muted-foreground">/login</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Open /login</Link>
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 border-border/80 bg-card p-6 text-card-foreground shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Register</p>
            <p className="font-mono text-xs text-muted-foreground">/register</p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/register">Open /register</Link>
          </Button>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        After signing in, go to{" "}
        <Link href="/dashboard" className="font-medium text-primary underline-offset-4 hover:underline">
          /dashboard
        </Link>
        .
      </p>
    </main>
  );
}
