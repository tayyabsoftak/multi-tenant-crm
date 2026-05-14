import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createCustomerForOrg, listCustomersForOrg } from "@/lib/services/CustomerService";
import { createCustomerSchema } from "@/lib/validations/CustomerSchema";
import { isOrgAdmin } from "@/lib/permissions";

function parseBool(v: string | null): boolean {
  return v === "1" || v === "true";
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  let status = (searchParams.get("status") ?? "all") as "all" | "active" | "unassigned" | "deleted";
  if (!isOrgAdmin(session.user.role) && status === "deleted") {
    status = "all";
  }
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10));
  const sortBy = (searchParams.get("sortBy") ?? "name") as "name" | "email" | "assignee";
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";
  const includeDeleted =
    isOrgAdmin(session.user.role) && parseBool(searchParams.get("includeDeleted"));

  const result = await listCustomersForOrg({
    organizationId: session.user.organizationId,
    search: q,
    status,
    includeDeleted,
    page,
    pageSize,
    sortBy,
    sortDir,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createCustomerSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assigneeId = isOrgAdmin(session.user.role)
    ? (parsed.data.assigneeId !== undefined ? parsed.data.assigneeId : session.user.id)
    : session.user.id;

  try {
    const data = await createCustomerForOrg(session.user.organizationId, session.user.id, {
      ...parsed.data,
      assigneeId,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "ASSIGN_LIMIT") {
      const isSelf = assigneeId === session.user.id;
      return NextResponse.json(
        { error: isSelf ? "You already have the maximum number of active customers (5)." : "This user already has the maximum number of active customers (5)." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
