import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isOrgAdmin } from "@/lib/permissions";
import { createUserInOrg, listUsersInOrg } from "@/lib/services/users.service";
import { prisma } from "@/lib/db";

const inviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "USER"]),
});

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await listUsersInOrg(session.user.organizationId);
  const grouped = await prisma.customer.groupBy({
    by: ["assigneeId"],
    where: {
      organizationId: session.user.organizationId,
      deletedAt: null,
      assigneeId: { not: null },
    },
    _count: { _all: true },
  });
  const countByUser = new Map<string, number>();
  for (const row of grouped) {
    if (row.assigneeId) countByUser.set(row.assigneeId, row._count._all);
  }

  const data = users.map((u) => ({
    ...u,
    assignedCustomerCount: countByUser.get(u.id) ?? 0,
  }));

  return NextResponse.json({ data });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = await createUserInOrg(session.user.organizationId, {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role as UserRole,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }
    throw e;
  }
}
