"use client";

import type { ReactNode } from "react";

import { isOrgAdmin } from "@/lib/permissions";

export function RoleGuard({
  role,
  allowAdminOnly,
  children,
  fallback = null,
}: {
  role: string | undefined;
  allowAdminOnly: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}): React.JSX.Element {
  if (allowAdminOnly && !isOrgAdmin(role ?? "")) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
