"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { NavLinks } from "@/components/dashboard/NavLinks";
import { Button } from "@/components/ui/button";
import { isOrgAdmin } from "@/lib/permissions";
import { cn, getInitials } from "@/lib/utils";

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}): React.JSX.Element {
  const { data } = useSession();
  const role = data?.user?.role ?? "USER";

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <Link href="/dashboard" className="truncate text-lg font-bold tracking-tight" onClick={onNavigate}>
          {data?.user?.organizationName?.toUpperCase() ?? ""}
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="mt-auto shrink-0 border-t p-4 space-y-4">
        {/* User Profile Section */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-black ring-1 ring-amber-400/20">
            {getInitials(data?.user?.name, data?.user?.email).charAt(0)}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden text-left">
            <div className="truncate text-sm font-medium text-foreground">
              {data?.user?.email}
            </div>
            <div className="text-xs text-muted-foreground">
              {isOrgAdmin(role) ? "Admin" : "Member"}
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full bg-border/40" />

        {/* Action Links */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 px-2 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
