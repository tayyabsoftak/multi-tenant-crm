import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isOrgAdmin } from "@/lib/permissions";
import {
  getCustomerById,
  getCustomerCounts,
  softDeleteCustomer,
  updateCustomerForOrg,
} from "@/lib/services/CustomerService";
import { updateCustomerSchema } from "@/lib/validations/CustomerSchema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const customer = await getCustomerById(session.user.organizationId, id);
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (customer.deletedAt && !isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const counts = await getCustomerCounts(session.user.organizationId, id);
  return NextResponse.json({ data: { ...customer, counts } });
}

export async function PUT(request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const phone = parsed.data.phone === "" ? null : parsed.data.phone;

  try {
    const data = await updateCustomerForOrg(session.user.organizationId, session.user.id, id, {
      ...parsed.data,
      phone,
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  try {
    await softDeleteCustomer(session.user.organizationId, session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
