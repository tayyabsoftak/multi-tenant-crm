import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isOrgAdmin } from "@/lib/permissions";
import { assignCustomer, unassignCustomer } from "@/lib/services/CustomerService";

const bodySchema = z.object({
  userId: z.string().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOrgAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: customerId } = await context.params;
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.userId === null) {
      const data = await unassignCustomer(session.user.organizationId, session.user.id, customerId);
      return NextResponse.json({ data });
    }
    const data = await assignCustomer(
      session.user.organizationId,
      session.user.id,
      customerId,
      parsed.data.userId,
    );
    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ASSIGN_LIMIT") {
      const isSelf = parsed.data.userId === session.user.id;
      return NextResponse.json(
        { error: isSelf ? "You already have the maximum number of assigned customers." : "This user already has the maximum number of assigned customers." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
