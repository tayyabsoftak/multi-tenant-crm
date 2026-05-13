"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { AppAvatar } from "@/components/common/AppAvatar";
import { FullPageSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityActions } from "@/lib/constants/crm";
import { isOrgAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type ActivityRow = {
  id: string;
  action: string;
  createdAt: string;
  metadata: unknown;
  actor: { id: string; name: string; email: string } | null;
  customer: { id: string; name: string; deletedAt: string | null } | null;
};

interface Summary {
  stats: {
    totalCustomers: number;
    activeAssigned: number;
    unassigned: number;
    teamMembers: number;
  };
  recentActivities: ActivityRow[];
  topAssignees: { userId: string; name: string; count: number }[];
}

function activityLabel(row: ActivityRow): string {
  const actor = row.actor?.name ?? "Someone";
  const meta = (row.metadata ?? {}) as Record<string, string>;
  const customer = row.customer?.name ?? meta.customerName ?? "customer";
  switch (row.action) {
    case ActivityActions.CUSTOMER_CREATED:
      return `${actor} created ${customer}`;
    case ActivityActions.CUSTOMER_UPDATED:
      return `${actor} updated ${customer}`;
    case ActivityActions.CUSTOMER_DELETED:
      return `${actor} deleted ${customer}`;
    case ActivityActions.CUSTOMER_RESTORED:
      return `${actor} restored ${customer}`;
    case ActivityActions.CUSTOMER_ASSIGNED:
      return `${actor} assigned ${customer} to ${meta.assigneeName ?? "user"}`;
    case ActivityActions.CUSTOMER_UNASSIGNED:
      return `${actor} unassigned ${customer}`;
    case ActivityActions.NOTE_ADDED:
      return `${actor} added a note on ${customer}`;
    default:
      return `${actor} · ${row.action}`;
  }
}

function StatCard({
  title,
  value,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  trend: string;
  loading: boolean;
}): React.JSX.Element {
  return (
    <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <TrendingUp className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold tracking-tight">{value}</div>
        )}
        <p className={cn("mt-1 text-xs text-muted-foreground")}>{trend}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardHome(): React.JSX.Element {
  const { data: session, status } = useSession();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = (await res.json()) as Summary;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <FullPageSpinner />;
  }

  const admin = isOrgAdmin(session?.user?.role ?? "");
  const chartData =
    data?.topAssignees.map((r) => ({
      name: r.name.length > 18 ? `${r.name.slice(0, 18)}…` : r.name,
      count: r.count,
    })) ?? [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total customers"
          value={data?.stats.totalCustomers ?? "—"}
          trend="+12% vs last month (mock)"
          loading={loading}
        />
        <StatCard
          title="Active (assigned)"
          value={data?.stats.activeAssigned ?? "—"}
          trend="+4% vs last month (mock)"
          loading={loading}
        />
        <StatCard
          title="Unassigned"
          value={data?.stats.unassigned ?? "—"}
          trend="Clear backlog (mock)"
          loading={loading}
        />
        {admin ? (
          <StatCard
            title="Team members"
            value={data?.stats.teamMembers ?? "—"}
            trend="Headcount (mock)"
            loading={loading}
          />
        ) : (
          <StatCard title="Team members" value="—" trend="Visible to admins" loading={loading} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {admin ? (
          <>
            <Card className="border-border/80 shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent activity</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/activity" className="gap-1">
                    View all
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : data?.recentActivities.length ? (
                  <ul className="space-y-3">
                    {data.recentActivities.map((row) => (
                      <li key={row.id} className="flex gap-3 text-sm">
                        <AppAvatar name={row.actor?.name} email={row.actor?.email} className="size-9" />
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug text-foreground">{activityLabel(row)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                            {row.customer && !row.customer.deletedAt ? (
                              <>
                                {" · "}
                                <Link
                                  href={`/dashboard/customers/${row.customer.id}`}
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  Open
                                </Link>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Top assignees</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : chartData.length ? (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 8 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assignments yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-border/80 shadow-sm lg:col-span-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Activity and assignment analytics are available to organization admins.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/customers?create=1">Add new customer</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/customers">View all customers</Link>
        </Button>
      </div>
    </div>
  );
}
