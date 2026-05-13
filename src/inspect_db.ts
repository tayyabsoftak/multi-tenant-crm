
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { organization: true },
  });
  console.log("USERS IN DB:");
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) | Org: ${u.organization.name} [${u.organizationId}] | Role: ${u.role}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
