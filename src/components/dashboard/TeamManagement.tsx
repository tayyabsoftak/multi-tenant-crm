"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FullPageSpinner } from "@/components/common/LoadingSpinner";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isOrgAdmin } from "@/lib/permissions";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  assignedCustomerCount: number;
}

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "USER"]),
});

export function TeamManagement(): React.JSX.Element {
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? "";
  const admin = isOrgAdmin(role);

  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadTeam = useCallback(async () => {
    const res = await fetch("/api/users");
    if (!res.ok) {
      setRows([]);
      toast.error("Could not load team");
      return;
    }
    const json = (await res.json()) as { data: UserRow[] };
    setRows(json.data);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      setLoading(true);
      await loadTeam();
      setLoading(false);
    })();
  }, [status, loadTeam]);

  const createForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "USER" },
  });

  if (status === "loading" || loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage users in your organization. Admins can create new team members.
          </p>
        </div>
        {admin ? (
          <Button onClick={() => setCreateOpen(true)}>Create user</Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AppAvatar name={u.name} email={u.email} />
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <StatusBadge variant={u.role === "ADMIN" ? "admin" : "member"}>
                        {u.role === "ADMIN" ? "Admin" : "Member"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(u.createdAt), "PP")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit(async (v) => {
              const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(v),
              });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                toast.error((j as { error?: string }).error ?? "Failed to create user");
                return;
              }
              toast.success("User created successfully");
              createForm.reset();
              setCreateOpen(false);
              void loadTeam();
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="tu-name">Name</Label>
              <Input id="tu-name" placeholder="John Doe" {...createForm.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tu-email">Email</Label>
              <Input id="tu-email" type="email" placeholder="john@example.com" {...createForm.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tu-password">Password</Label>
              <Input id="tu-password" type="password" autoComplete="new-password" {...createForm.register("password")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tu-role">Role</Label>
              <Input id="tu-role" value="Member" disabled className="bg-muted" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
