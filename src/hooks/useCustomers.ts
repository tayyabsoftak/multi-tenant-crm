"use client";

import { useCallback, useEffect, useState } from "react";

import type { CustomerRow } from "@/types";

interface ListResult {
  data: CustomerRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function useCustomers(queryString: string): {
  data: CustomerRow[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?${queryString}`);
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as ListResult;
      setData(json.data);
      setTotal(json.total);
    } catch {
      setError("Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, total, loading, error, refetch };
}
