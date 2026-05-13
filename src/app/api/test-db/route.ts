import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    return NextResponse.json({
      ok: true,
      message: "Prisma connected to PostgreSQL successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        message: "Prisma could not connect or query the database.",
        error: message,
      },
      { status: 500 },
    );
  }
}
