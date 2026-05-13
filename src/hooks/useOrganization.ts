"use client";

import { useSession } from "next-auth/react";

export function useOrganization(): { id: string; name: string } {
  const { data } = useSession();
  return {
    id: data?.user?.organizationId ?? "",
    name: data?.user?.organizationName ?? "",
  };
}
