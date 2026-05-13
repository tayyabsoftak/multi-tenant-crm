"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}): React.JSX.Element {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-muted-foreground", className)} role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function FullPageSpinner(): React.JSX.Element {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}
