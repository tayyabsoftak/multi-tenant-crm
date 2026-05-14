"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppAvatar } from "@/components/common/AppAvatar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { FullPageSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CustomerDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  assigneeId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; email: string } | null;
  counts: { notesCount: number; activitiesCount: number };
}

interface NoteRow {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

const noteSchema = z.object({ content: z.string().min(1).max(5000) });

export function CustomerDetailView({ id }: { id: string }): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();
  const admin = isOrgAdmin(session?.user?.role ?? "");
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const cRes = await fetch(`/api/customers/${id}`);
      if (!cRes.ok) {
        setCustomer(null);
        return;
      }
      const cJson = (await cRes.json()) as { data: CustomerDetail };
      setCustomer(cJson.data);

      if (admin) {
        const aRes = await fetch(`/api/activity?customerId=${encodeURIComponent(id)}&pageSize=50`);
        if (aRes.ok) {
          const aJson = (await aRes.json()) as { items: ActivityItem[] };
          setActivities(aJson.items);
        } else {
          setActivities([]);
        }
      } else {
        setActivities([]);
      }

      const nRes = await fetch(`/api/customers/${id}/notes`);
      if (nRes.ok) {
        const nJson = (await nRes.json()) as { data: NoteRow[] };
        setNotes(nJson.data);
      }
    } finally {
      setLoading(false);
    }
  }, [id, admin]);

  useEffect(() => {
    void loadCustomerData();
  }, [loadCustomerData]);

  const noteForm = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  });

  if (loading) return <FullPageSpinner />;
  if (!customer) {
    return <p className="text-sm text-muted-foreground">Customer not found.</p>;
  }

  const deleted = !!customer.deletedAt;
  const assigned = !!customer.assigneeId && !deleted;


  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/customers">Customers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customer.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.email ?? "—"}</p>
          <div className="mt-2">
            {deleted ? (
              <StatusBadge variant="deleted">Deleted</StatusBadge>
            ) : assigned ? (
              <StatusBadge variant="active">Active</StatusBadge>
            ) : (
              <StatusBadge variant="unassigned">Unassigned</StatusBadge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="mr-2 size-4" />
              Back to List
            </Link>
          </Button>
          {!deleted && admin ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 size-4" />
              Delete Customer
            </Button>
          ) : null}
          {deleted && admin ? (
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch(`/api/customers/${id}/restore`, { method: "POST" });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  toast.error(j.error || "Restore failed");
                } else {
                  toast.success("Customer restored successfully");
                  void loadCustomerData();
                }
              }}
            >
              <RotateCcw className="mr-2 size-4" />
              Restore Customer
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Phone</span>
              <p>{customer.phone ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p>{format(new Date(customer.createdAt), "PPp")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated</span>
              <p>{format(new Date(customer.updatedAt), "PPp")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{customer.assignee?.name ?? "Unassigned"}</p>
            {admin ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/customers?assign=${customer.id}`}>Change Assignment</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Total Notes: {customer.counts.notesCount}</p>
            <p>Total Activities: {customer.counts.activitiesCount}</p>
          </CardContent>
        </Card>
      </div>

      {admin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length ? (
              activities.map((row) => (
                <div key={row.id} className="flex gap-3 border-b pb-3 text-sm last:border-0 last:pb-0">
                  <AppAvatar name={row.actor?.name} email={row.actor?.email} className="size-8" />
                  <div>
                    <p>{formatActivityLabel(row.action, row.actor?.name, customer.name, row.metadata)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activity recorded for this customer.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.map((n) => (
            <div key={n.id} className="rounded-md border p-3">
              <p className="whitespace-pre-wrap text-sm">{n.content}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{n.author.name}</span>
                <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
              </div>
              {admin ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-destructive"
                  onClick={async () => {
                    const res = await fetch(`/api/notes/${n.id}`, { method: "DELETE" });
                    if (!res.ok) toast.error("Delete failed");
                    else void loadCustomerData();
                  }}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          ))}
          {customer.deletedAt ? (
            <p className="text-sm text-muted-foreground italic border-t pt-4">
              Cannot add notes to a deleted customer.
            </p>
          ) : (
            <form
              className="space-y-2 border-t pt-4"
              onSubmit={noteForm.handleSubmit(async (v) => {
                const res = await fetch(`/api/customers/${id}/notes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                });
                if (!res.ok) toast.error("Could not add note");
                else {
                  noteForm.reset();
                  void loadCustomerData();
                }
              })}
            >
              <Label htmlFor="note">Add New Note</Label>
              <Textarea id="note" rows={3} placeholder="Enter note content..." {...noteForm.register("content")} />
              {noteForm.formState.errors.content ? (
                <p className="text-xs text-destructive">{noteForm.formState.errors.content.message}</p>
              ) : null}
              <Button type="submit" disabled={noteForm.formState.isSubmitting}>
                {noteForm.formState.isSubmitting ? "Submitting..." : "Add Note"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Soft-delete this customer?"
        description="Notes and activity logs will remain. You can restore this customer later from the list view."
        variant="destructive"
        confirmLabel="Delete Customer"
        onConfirm={async () => {
          const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
          if (!res.ok) toast.error("Delete operation failed");
          else {
            toast.success("Customer deleted successfully");
            router.push("/dashboard/customers");
          }
        }}
      />
    </div>
  );
}
