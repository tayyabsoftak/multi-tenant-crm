"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/use-auth-store";

export const useCurrentOrg = (): string | null => {
  const user = useAuthStore((state) => state.user);
  return useMemo(() => user?.organizationId ?? null, [user?.organizationId]);
};
