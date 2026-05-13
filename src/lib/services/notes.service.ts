import { ActivityActions } from "@/lib/constants/crm";
import { logActivity } from "@/lib/services/activity-log.service";
import { prisma } from "@/lib/db";

export async function listNotesForCustomer(organizationId: string, customerId: string) {
  return prisma.note.findMany({
    where: { organizationId, customerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createNote(
  organizationId: string,
  authorId: string,
  customerId: string,
  content: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
    select: { name: true },
  });
  if (!customer) throw new Error("Customer not found.");

  const note = await prisma.note.create({
    data: {
      organizationId,
      customerId,
      authorId,
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    organizationId,
    actorId: authorId,
    action: ActivityActions.NOTE_ADDED,
    customerId,
    metadata: { preview: content.slice(0, 80) },
  });

  return note;
}

export async function softDeleteNote(organizationId: string, noteId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, organizationId, deletedAt: null },
  });
  if (!note) throw new Error("Note not found.");

  await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });
}
