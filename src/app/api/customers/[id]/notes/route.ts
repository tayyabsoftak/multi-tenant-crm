import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isOrgAdmin } from "@/lib/permissions";
import { createNote, listNotesForCustomer } from "@/lib/services/NoteService";
import { getCustomerById } from "@/lib/services/CustomerService";

import { createNoteSchema } from "@/lib/validations/NoteSchema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: customerId } = await context.params;
  const customer = await getCustomerById(session.user.organizationId, customerId);
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (customer.deletedAt && !isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const data = await listNotesForCustomer(session.user.organizationId, customerId);
  return NextResponse.json({ data });
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: customerId } = await context.params;
  const customer = await getCustomerById(session.user.organizationId, customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (customer.deletedAt && !isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const data = await createNote(
      session.user.organizationId,
      session.user.id,
      customerId,
      parsed.data.content,
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
}
