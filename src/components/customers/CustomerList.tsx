"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, MessageSquare, Pencil, Trash2, UserPlus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PaginationBar } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppAvatar } from "@/components/common/AppAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ACTIVE_ASSIGNMENTS_PER_USER } from "@/lib/constants/crm";
import { isOrgAdmin } from "@/lib/permissions";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations/CustomerSchema";
import { useDebounce } from "@/hooks/useDebounce";
import type { CustomerRow } from "@/types";

type StatusFilter = "all" | "active" | "unassigned" | "deleted";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedCustomerCount: number;
}

interface NoteRow {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

export function CustomerList(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const admin = isOrgAdmin(session?.user?.role ?? "");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!admin && status === "deleted") {
      setStatus("all");
    }
  }, [admin, status]);

  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"name" | "email" | "assignee">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<CustomerRow | null>(null);
  const [assignRow, setAssignRow] = useState<CustomerRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<CustomerRow | null>(null);
  const [notesCustomer, setNotesCustomer] = useState<CustomerRow | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  
  const members = useMemo(() => users.filter((u) => u.role === "USER"), [users]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        status,
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortDir,
      });
      if (includeDeleted) params.set("includeDeleted", "1");
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as { data: CustomerRow[]; total: number };
      setRows(json.data);
      setTotal(json.total);
    } catch {
      toast.error("Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page, pageSize, sortBy, sortDir, includeDeleted]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
      router.replace("/dashboard/customers", { scroll: false });
    }
  }, [searchParams, router]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (!res.ok) return;
    const json = (await res.json()) as { data: UserOption[] };
    setUsers(json.data);
  }, []);

  useEffect(() => {
    if (admin && (assignRow || createOpen || editRow)) void loadUsers();
  }, [admin, assignRow, createOpen, editRow, loadUsers]);

  const openNotes = async (row: CustomerRow): Promise<void> => {
    setNotesCustomer(row);
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/customers/${row.id}/notes`);
      const json = (await res.json()) as { data: NoteRow[] };
      setNotes(json.data);
    } catch {
      toast.error("Could not load notes");
    } finally {
      setNoteLoading(false);
    }
  };

  const toggleSort = (field: "name" | "email" | "assignee"): void => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-xl flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search name or email…"
            isLoading={search !== debouncedSearch}
            className="sm:flex-1"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="active">Active (assigned)</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {admin ? <SelectItem value="deleted">Deleted</SelectItem> : null}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {admin ? (
            <div className="flex items-center gap-2">
              <Switch id="del" checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
              <Label htmlFor="del" className="text-sm text-muted-foreground">
                Show deleted
              </Label>
            </div>
          ) : null}
          <Button onClick={() => setCreateOpen(true)}>Add customer</Button>
        </div>
      </div>

      <Card className="border-border/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[44px]" />
                <TableHead>
                  <button type="button" className="font-semibold hover:underline" onClick={() => toggleSort("name")}>
                    Name {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="font-semibold hover:underline" onClick={() => toggleSort("email")}>
                    Email {sortBy === "email" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="font-semibold hover:underline"
                    onClick={() => toggleSort("assignee")}
                  >
                    Assigned to {sortBy === "assignee" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    No customers match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const deleted = !!row.deletedAt;
                  const assigned = !!row.assigneeId && !deleted;
                  return (
                    <TableRow key={row.id} data-state={deleted ? "muted" : undefined}>
                      <TableCell>
                        <AppAvatar name={row.name} email={row.email} className="size-8" />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/customers/${row.id}`} className="hover:underline">
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.email ?? "—"}</TableCell>
                      <TableCell>{row.phone ?? "—"}</TableCell>
                      <TableCell>
                        {row.assignee ? (
                          <span className="text-sm">{row.assignee.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deleted ? (
                          <StatusBadge variant="deleted">Deleted</StatusBadge>
                        ) : assigned ? (
                          <StatusBadge variant="active">Active</StatusBadge>
                        ) : (
                          <StatusBadge variant="unassigned">Unassigned</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link href={`/dashboard/customers/${row.id}`}>
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                          {admin ? (
                            <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditRow(row)}>
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" title="Notes" onClick={() => void openNotes(row)}>
                            <MessageSquare className="size-4" />
                          </Button>
                          {!deleted && admin ? (
                            <>
                              <Button variant="ghost" size="icon" title="Assign" onClick={() => setAssignRow(row)}>
                                <UserPlus className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteRow(row)}>
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </>
                          ) : null}
                          {deleted && admin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Restore"
                              onClick={async () => {
                                const res = await fetch(`/api/customers/${row.id}/restore`, { method: "POST" });
                                if (!res.ok) toast.error("Restore failed");
                                else {
                                  toast.success("Customer restored");
                                  void fetchCustomers();
                                }
                              }}
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>

      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        users={members}
        isAdmin={admin}
        title="Create Customer"
        onSaved={() => {
          void fetchCustomers();
          setCreateOpen(false);
        }}
      />
      <CustomerFormDialog
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        users={members}
        isAdmin={admin}
        title="Edit Customer"
        initial={editRow ?? undefined}
        onSaved={() => {
          void fetchCustomers();
          setEditRow(null);
        }}
      />

      {admin ? (
        <AssignDialog
          row={assignRow}
          users={members}
          onClose={() => setAssignRow(null)}
          onDone={() => {
            void fetchCustomers();
            setAssignRow(null);
          }}
        />
      ) : null}

      {admin ? (
        <ConfirmDialog
          open={!!deleteRow}
          onOpenChange={(o) => !o && setDeleteRow(null)}
          title="Soft-delete customer?"
          description="Notes and activity will remain. You can restore later."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={async () => {
            if (!deleteRow) return;
            const res = await fetch(`/api/customers/${deleteRow.id}`, { method: "DELETE" });
            if (!res.ok) toast.error("Delete failed");
            else {
              toast.success("Customer deleted");
              setDeleteRow(null);
              void fetchCustomers();
            }
          }}
        />
      ) : null}

      <Sheet open={!!notesCustomer} onOpenChange={(o) => !o && setNotesCustomer(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notes · {notesCustomer?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {noteLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : notes.length ? (
                notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3 text-sm">
                    <p className="whitespace-pre-wrap">{n.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{n.author.name}</span>
                      <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                    </div>
                    {admin && notesCustomer ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-destructive"
                        onClick={async () => {
                          const res = await fetch(`/api/notes/${n.id}`, { method: "DELETE" });
                          if (!res.ok) toast.error("Could not delete note");
                          else {
                            toast.success("Note removed");
                            void openNotes(notesCustomer);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
            </div>
            <div className="shrink-0 space-y-2 border-t pt-4">
              <Label htmlFor="newnote">Add note</Label>
              <Textarea
                id="newnote"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Write a note…"
              />
              <Button
                disabled={!noteText.trim() || !notesCustomer}
                onClick={async () => {
                  if (!notesCustomer) return;
                  const res = await fetch(`/api/customers/${notesCustomer.id}/notes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: noteText }),
                  });
                  if (!res.ok) toast.error("Could not add note");
                  else {
                    setNoteText("");
                    toast.success("Note added");
                    void openNotes(notesCustomer);
                  }
                }}
              >
                Save note
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerFormDialog({
  open,
  onOpenChange,
  users,
  isAdmin,
  title,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  users: UserOption[];
  isAdmin: boolean;
  title: string;
  initial?: CustomerRow;
  onSaved: () => void;
}): React.JSX.Element {
  const schema = initial ? updateCustomerSchema : createCustomerSchema;
  type FormValues = z.infer<typeof createCustomerSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      assigneeId: null,
    },
  });

  useEffect(() => {
    if (open && initial) {
      form.reset({
        name: initial.name,
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        assigneeId: initial.assigneeId,
      });
    }
    if (open && !initial) {
      form.reset({ name: "", email: "", phone: "", assigneeId: null });
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (values) => {
    const base = {
      name: values.name,
      email: values.email === "" ? undefined : values.email,
      phone: values.phone === "" ? null : values.phone,
    };
    const body =
      isAdmin
        ? { ...base, assigneeId: values.assigneeId ?? null }
        : base;
    const res = initial
      ? await fetch(`/api/customers/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error ?? "Save failed");
      return;
    }
    toast.success(initial ? "Customer updated" : "Customer created");
    onSaved();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="c-email" type="email" placeholder="customer@example.com" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-phone">Phone</Label>
            <Input id="c-phone" {...form.register("phone")} />
          </div>
          {isAdmin ? (
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select
                value={form.watch("assigneeId") ?? ""}
                onValueChange={(v) => form.setValue("assigneeId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({
  row,
  users,
  onClose,
  onDone,
}: {
  row: CustomerRow | null;
  users: UserOption[];
  onClose: () => void;
  onDone: () => void;
}): React.JSX.Element {
  const [userId, setUserId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => users.find((u) => u.id === userId), [users, userId]);
  const atLimit =
    !!selected &&
    !!userId &&
    userId !== row?.assigneeId &&
    selected.assignedCustomerCount >= MAX_ACTIVE_ASSIGNMENTS_PER_USER;

  useEffect(() => {
    if (row) setUserId(row.assigneeId ?? "");
  }, [row]);

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Customer</DialogTitle>
        </DialogHeader>
        {row ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Current: {row.assignee?.name ?? <em>Unassigned</em>}
            </p>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && userId ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This user has {selected.assignedCustomerCount}/{MAX_ACTIVE_ASSIGNMENTS_PER_USER} active customers.
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saving || atLimit}
                onClick={async () => {
                  if (!row) return;
                  setSaving(true);
                  try {
                    const res = await fetch(`/api/customers/${row.id}/assign`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: userId }),
                    });
                    if (!res.ok) {
                      const j = await res.json().catch(() => ({}));
                      toast.error((j as { error?: string }).error ?? "Assignment failed");
                    } else {
                      toast.success("Assignment updated");
                      onDone();
                    }
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
