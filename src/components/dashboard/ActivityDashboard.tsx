"use client";

import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppAvatar } from "@/components/common/AppAvatar";
import { FullPageSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityActions } from "@/lib/constants/crm";
import { isOrgAdmin } from "@/lib/permissions";
import { formatActivityLabel } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  createdAt: string;
  metadata: unknown;
  actor: { id: string; name: string; email: string } | null;
  customer: { id: string; name: string; deletedAt: string | null } | null;
}

export function ActivityDashboard(): React.JSX.Element {
  const router = useRouter();
  const { status, data } = useSession();
  const admin = isOrgAdmin(data?.user?.role ?? "");

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [actorId, setActorId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actors, setActors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void fetch("/api/users")
      .then((r) => r.json())
      .then((j: { data: { id: string; name: string }[] }) => {
        setActors(j.data.map((u) => ({ id: u.id, name: u.name })));
      })
      .catch(() => { });
  }, []);

  const fetchList = useCallback(async () => {
    if (!admin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        entityType,
        action,
        actorId,
      });
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/activity?${params.toString()}`);
      if (!res.ok) throw new Error("fail");
      const json = (await res.json()) as { items: ActivityItem[]; total: number };
      setItems(json.items);
      setTotal(json.total);
    } catch {
      toast.error("Could not load activity");
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, actorId, dateFrom, dateTo, admin]);

  useEffect(() => {
    if (status === "authenticated" && !admin) {
      router.replace("/dashboard");
    }
  }, [status, admin, router]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const exportCsv = (): void => {
    const header = ["time", "description"];
    const lines = items.map((row) => [
      format(new Date(row.createdAt), "yyyy-MM-dd HH:mm:ss"),
      formatActivityLabel(row.action, row.actor?.name, row.customer?.name, row.metadata).replaceAll('"', '""'),
    ]);
    const csv = [header.join(","), ...lines.map((l) => l.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading") return <FullPageSpinner />;
  if (!admin) return <FullPageSpinner />;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="df">From</Label>
            <Input
              id="df"
              type="date"
              max={today}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dt">To</Label>
            <Input
              id="dt"
              type="date"
              max={today}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              <SelectItem value="Customer">Customer</SelectItem>
              <SelectItem value="Note">Note</SelectItem>
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value={ActivityActions.CUSTOMER_CREATED}>Created</SelectItem>
              <SelectItem value={ActivityActions.CUSTOMER_UPDATED}>Updated</SelectItem>
              <SelectItem value={ActivityActions.CUSTOMER_DELETED}>Deleted</SelectItem>
              <SelectItem value={ActivityActions.CUSTOMER_RESTORED}>Restored</SelectItem>
              <SelectItem value={ActivityActions.CUSTOMER_ASSIGNED}>Assigned</SelectItem>
              <SelectItem value={ActivityActions.NOTE_ADDED}>Note added</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actorId} onValueChange={setActorId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEntityType("all");
              setAction("all");
              setActorId("all");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
          <Button type="button" variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length ? (
            items.map((row) => (
              <div key={row.id} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">
                <AppAvatar name={row.actor?.name} email={row.actor?.email} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    {formatActivityLabel(row.action, row.actor?.name, row.customer?.name, row.metadata)}
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground"
                    title={format(new Date(row.createdAt), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </p>
                  {row.customer && !row.customer.deletedAt ? (
                    <Link
                      href={`/dashboard/customers/${row.customer.id}`}
                      className="mt-1 inline-block text-xs text-primary underline-offset-2 hover:underline"
                    >
                      View customer
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No activity.</p>
          )}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">{total} events</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
