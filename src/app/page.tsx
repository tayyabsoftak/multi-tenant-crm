import Link from "next/link";
import { ArrowRight, Box } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home(): React.JSX.Element {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-[500px] text-center space-y-8">
        
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-card text-foreground shadow-sm">
          <Box className="size-6" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Multi-Tenant CRM
          </h1>
          <p className="text-sm text-muted-foreground">
            A production-ready platform for managing customers securely across isolated workspaces.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/register">
              Create workspace
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <div className="border-t pt-8 text-xs text-muted-foreground">
          Built for the Full Stack Engineer assignment
        </div>

      </div>
    </main>
  );
}
