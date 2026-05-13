"use client";

import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";

import { DashboardNavLinks } from "@/components/dashboard/nav-links";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isOrgAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const n = (name ?? email ?? "?").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}): React.JSX.Element {
  const { data } = useSession();
  const role = data?.user?.role ?? "USER";
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight" onClick={onNavigate}>
          CRM
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DashboardNavLinks onNavigate={onNavigate} />
      </div>
      <div className="shrink-0 border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2">
              <Avatar className="size-9">
                <AvatarFallback>{initials(data?.user?.name, data?.user?.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left text-sm">
                <div className="truncate font-medium">{data?.user?.name ?? "User"}</div>
                <div className="truncate text-xs text-muted-foreground">{data?.user?.email}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <User className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="cursor-pointer"
            >
              {resolvedTheme === "dark" ? (
                <>
                  <Sun className="mr-2 size-4" /> Light mode
                </>
              ) : (
                <>
                  <Moon className="mr-2 size-4" /> Dark mode
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="mt-2 px-1 text-xs text-muted-foreground">
          Role: {isOrgAdmin(role) ? "Admin" : "Member"}
        </div>
      </div>
    </div>
  );
}
