import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Password123", 10);

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "CRM App Solutions",
    },
  });

  console.log(`Created organization: ${org.name} (${org.id})`);

  // 2. Create Admin User
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "admin@crmapp.com",
      name: "Admin User",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Created admin: ${admin.email}`);

  // 3. Create Member User
  const sara = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "sara@crmapp.com",
      name: "Sara Member",
      passwordHash,
      role: UserRole.USER,
    },
  });

  console.log(`Created member: ${sara.email}`);

  // 4. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "Global Tech Inc",
      email: "contact@globaltech.com",
      phone: "+1-555-0199",
      assigneeId: sara.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "Summit Logistics",
      email: "ops@summit.io",
      phone: "+1-555-0244",
      assigneeId: sara.id,
    },
  });

  console.log(`Created customers: ${customer1.name}, ${customer2.name}`);

  // 5. Create Notes
  await prisma.note.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      authorId: sara.id,
      content: "Initial contact made. They are interested in our premium support package.",
    },
  });

  await prisma.note.create({
    data: {
      organizationId: org.id,
      customerId: customer2.id,
      authorId: admin.id,
      content: "Strategic account move. Needs high-priority attention.",
    },
  });

  console.log("Seed data created successfully!");
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
