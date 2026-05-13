"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  LayoutDashboard,
  Users as UsersIcon,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { isOrgAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavLinkItem = { href: string; label: string; icon: LucideIcon };

export function DashboardNavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}): React.JSX.Element {
  const pathname = usePathname();
  const { data } = useSession();
  const admin = isOrgAdmin(data?.user?.role ?? "");

  const links = useMemo((): NavLinkItem[] => {
    const base: NavLinkItem[] = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/customers", label: "Customers", icon: UsersIcon },
    ];
    if (admin) {
      base.push({ href: "/dashboard/activity", label: "Activity", icon: Activity });
    }
    base.push({ href: "/dashboard/team", label: "Team", icon: UserCog });
    return base;
  }, [admin]);

  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
