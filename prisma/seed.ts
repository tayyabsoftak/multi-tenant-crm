import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Password123", 10);

  const org = await prisma.organization.upsert({
    where: { id: "seed-org-id" },
    update: {},
    create: {
      id: "seed-org-id",
      name: "Acme Org",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash, name: "Acme Admin", role: UserRole.ADMIN, organizationId: org.id },
    create: {
      id: "seed-admin-id",
      organizationId: org.id,
      email: "admin@example.com",
      name: "Acme Admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: { passwordHash, name: "Acme Member", role: UserRole.USER, organizationId: org.id },
    create: {
      id: "seed-member-id",
      organizationId: org.id,
      email: "member@example.com",
      name: "Acme Member",
      passwordHash,
      role: UserRole.USER,
    },
  });

  await prisma.customer.upsert({
    where: { id: "seed-customer-id" },
    update: {
      name: "Seed Customer",
      email: "customer@example.com",
      assigneeId: member.id,
    },
    create: {
      id: "seed-customer-id",
      organizationId: org.id,
      name: "Seed Customer",
      email: "customer@example.com",
      assigneeId: member.id,
    },
  });
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
