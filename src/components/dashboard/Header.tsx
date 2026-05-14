"use client";

import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/customers": "Customers",
  "/dashboard/activity": "Activity",
  "/dashboard/team": "Team",
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/customers/") && pathname !== "/dashboard/customers") {
    return "Customer";
  }
  return titles[pathname] ?? "Dashboard";
}

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const n = (name ?? email ?? "?").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const { data } = useSession();
  const role = data?.user?.role ?? "USER";
  const orgName = data?.user?.organizationName ?? "Organization";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{pageTitle(pathname)}</h1>
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            {orgName}
          </Badge>
        </div>
      </div>
    </header>
  );
}
