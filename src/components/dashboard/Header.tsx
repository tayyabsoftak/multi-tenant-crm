"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isOrgAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

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

export function Header({ onOpenMobile }: { onOpenMobile: () => void }): React.JSX.Element {
  const pathname = usePathname();
  const { data } = useSession();
  const role = data?.user?.role ?? "USER";
  const orgName = data?.user?.organizationName ?? "Organization";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobile}>
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{pageTitle(pathname)}</h1>
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            {orgName}
          </Badge>
        </div>
      </div>
      <div className="relative hidden max-w-xs flex-1 md:block lg:max-w-md">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          readOnly
          placeholder="Search customers… (soon)"
          className={cn("h-9 bg-muted/50 pl-9")}
        />
      </div>
      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
        <Bell className="size-5" />
        <span className="sr-only">Notifications</span>
      </Button>
      <div className="hidden items-center gap-2 sm:flex">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials(data?.user?.name, data?.user?.email)}</AvatarFallback>
        </Avatar>
        <Badge variant={isOrgAdmin(role) ? "default" : "secondary"} className="capitalize">
          {isOrgAdmin(role) ? "Admin" : "Member"}
        </Badge>
      </div>
    </header>
  );
}
