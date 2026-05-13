"use client";

import { isOrgAdmin } from "@/lib/permissions";

export function usePermissions(role: string | undefined): {
  isAdmin: boolean;
  canManageTeam: boolean;
  roleLabel: string;
} {
  const r = role ?? "USER";
  return {
    isAdmin: isOrgAdmin(r),
    canManageTeam: isOrgAdmin(r),
    roleLabel: isOrgAdmin(r) ? "Admin" : "Member",
  };
}
