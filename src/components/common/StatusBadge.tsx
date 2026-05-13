"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = "active" | "unassigned" | "deleted" | "admin" | "member" | "default";

const styles: Record<Variant, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  unassigned: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  deleted: "border-destructive/30 bg-destructive/10 text-destructive",
  admin: "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  member: "border-border bg-muted text-muted-foreground",
  default: "",
};

export function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[variant], className)}>
      {children}
    </Badge>
  );
}
