import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { registerBodySchema } from "@/lib/validations/auth";

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();


  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: parsed.data.organizationName.trim() },
    });
    await tx.user.create({
      data: {
        organizationId: org.id,
        email,
        name: parsed.data.name.trim(),
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
