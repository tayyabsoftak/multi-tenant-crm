import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createNote } from "@/lib/services/NoteService";
import { createNoteWithCustomerSchema } from "@/lib/validations/NoteSchema";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createNoteWithCustomerSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = await createNote(
      session.user.organizationId,
      session.user.id,
      parsed.data.customerId,
      parsed.data.content,
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
}
