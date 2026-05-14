"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppAvatar } from "@/components/common/AppAvatar";
import { FullPageSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isOrgAdmin } from "@/lib/permissions";
import { formatActivityLabel } from "@/lib/utils";

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

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: string | number;
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
      </CardContent>
    </Card>
  );
}

export function DashboardOverview(): React.JSX.Element {
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total customers"
          value={data?.stats.totalCustomers ?? "—"}
          loading={loading}
        />
        <StatCard
          title="Active (assigned)"
          value={data?.stats.activeAssigned ?? "—"}
          loading={loading}
        />
        {admin &&
          <StatCard
            title="Team members"
            value={data?.stats.teamMembers ?? "—"}
            loading={loading}
          />
        }
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {admin && (
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
                  <ul className="space-y-6">
                    {data.recentActivities.slice(0, 6).map((row) => (
                      <li key={row.id} className="flex items-start gap-4 text-sm">
                        <AppAvatar name={row.actor?.name} email={row.actor?.email} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug text-foreground">
                            {formatActivityLabel(row.action, row.actor?.name, row.customer?.name, row.metadata)}
                          </p>
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

            <Card className="border-border/80 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  Top Performers
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/team" className="gap-1">
                    View all
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-2">
                {loading ? (
                  <div className="space-y-4 px-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : data?.topAssignees.length ? (
                  <div className="space-y-2">
                    {data.topAssignees.slice(0, 6).map((user, idx) => (
                      <div key={user.userId} className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/50">
                        <div className="flex w-6 items-center justify-center text-sm font-bold text-muted-foreground">
                          #{idx + 1}
                        </div>
                        <AppAvatar name={user.name} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                            {user.count} active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Tracking assignments…</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
