"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string | null | undefined, email?: string | null): string {
  const n = (name ?? email ?? "?").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function AppAvatar({
  name,
  email,
  className,
}: {
  name: string | null | undefined;
  email?: string | null;
  className?: string;
}): React.JSX.Element {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback className="text-xs">{initials(name, email)}</AvatarFallback>
    </Avatar>
  );
}
