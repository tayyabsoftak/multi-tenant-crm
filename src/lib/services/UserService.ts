import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function listUsersInOrg(organizationId: string) {
  if (!organizationId) {
    throw new Error("Organization ID is required for user isolation.");
  }
  return prisma.user.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function createUserInOrg(
  organizationId: string,
  data: { name: string; email: string; password: string; role: UserRole },
) {
  const email = data.email.trim().toLowerCase();
  const exists = await prisma.user.findFirst({
    where: { organizationId, email },
  });
  if (exists) throw new Error("EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      organizationId,
      email,
      name: data.name.trim(),
      passwordHash,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}
