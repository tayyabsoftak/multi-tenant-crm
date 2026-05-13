import { Prisma } from "@prisma/client";

import { ActivityActions, MAX_ACTIVE_ASSIGNMENTS_PER_USER } from "@/lib/constants/crm";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validations/customer";
import { logActivity } from "@/lib/services/activity-log.service";
import { prisma } from "@/lib/db";

export type CustomerStatusFilter = "all" | "active" | "unassigned" | "deleted";
export type CustomerSortField = "name" | "email" | "assignee";

export interface ListCustomersParams {
  organizationId: string;
  search?: string;
  status: CustomerStatusFilter;
  includeDeleted: boolean;
  page: number;
  pageSize: number;
  sortBy: CustomerSortField;
  sortDir: "asc" | "desc";
}

const assigneeOrder = (dir: Prisma.SortOrder): Prisma.CustomerOrderByWithRelationInput => ({
  assignee: { name: dir },
});

export async function listCustomersForOrg(params: ListCustomersParams) {
  if (!params.organizationId) {
    throw new Error("Organization ID is required for isolation.");
  }
  const where: Prisma.CustomerWhereInput = { organizationId: params.organizationId };

  if (params.status === "deleted") {
    where.deletedAt = { not: null };
  } else if (params.status === "active") {
    where.deletedAt = null;
    where.assigneeId = { not: null };
  } else if (params.status === "unassigned") {
    where.deletedAt = null;
    where.assigneeId = null;
  } else if (params.status === "all") {
    if (!params.includeDeleted) {
      where.deletedAt = null;
    }
  }

  const q = params.search?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.CustomerOrderByWithRelationInput[] = [];
  const dir = params.sortDir;
  if (params.sortBy === "name") orderBy.push({ name: dir });
  else if (params.sortBy === "email") orderBy.push({ email: dir });
  else orderBy.push(assigneeOrder(dir));

  const skip = (params.page - 1) * params.pageSize;

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip,
      take: params.pageSize,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data: rows, total, page: params.page, pageSize: params.pageSize };
}

export async function getCustomerById(organizationId: string, customerId: string) {
  if (!organizationId) {
    throw new Error("Organization ID is required for isolation.");
  }
  return prisma.customer.findFirst({
    where: { id: customerId, organizationId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createCustomerForOrg(
  organizationId: string,
  actorId: string,
  input: CreateCustomerInput,
) {
  const customer = await prisma.customer.create({
    data: {
      organizationId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      assigneeId: input.assigneeId ?? null,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    organizationId,
    actorId,
    action: ActivityActions.CUSTOMER_CREATED,
    customerId: customer.id,
    metadata: { customerName: customer.name },
  });

  return customer;
}

export async function updateCustomerForOrg(
  organizationId: string,
  actorId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!existing) {
    throw new Error("Customer not found.");
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    organizationId,
    actorId,
    action: ActivityActions.CUSTOMER_UPDATED,
    customerId: customer.id,
    metadata: { customerName: customer.name },
  });

  return customer;
}

export async function softDeleteCustomer(organizationId: string, actorId: string, customerId: string) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error("Customer not found.");

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: new Date() },
  });

  await logActivity({
    organizationId,
    actorId,
    action: ActivityActions.CUSTOMER_DELETED,
    customerId,
    metadata: { customerName: customer.name },
  });

  return customer;
}

export async function restoreCustomer(organizationId: string, actorId: string, customerId: string) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: { not: null } },
  });
  if (!existing) throw new Error("Customer not found or not deleted.");

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: null },
  });

  await logActivity({
    organizationId,
    actorId,
    action: ActivityActions.CUSTOMER_RESTORED,
    customerId,
    metadata: { customerName: customer.name },
  });

  return customer;
}

export async function assignCustomer(
  organizationId: string,
  actorId: string,
  customerId: string,
  assigneeId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, organizationId, deletedAt: null },
      });
      if (!customer) throw new Error("Customer not found.");

      const assignee = await tx.user.findFirst({
        where: { id: assigneeId, organizationId, deletedAt: null },
      });
      if (!assignee) throw new Error("Assignee not found.");

      const othersForAssignee = await tx.customer.count({
        where: {
          organizationId,
          assigneeId,
          deletedAt: null,
          id: { not: customerId },
        },
      });
      if (othersForAssignee >= MAX_ACTIVE_ASSIGNMENTS_PER_USER) {
        throw new Error("ASSIGN_LIMIT");
      }

      const updated = await tx.customer.update({
        where: { id: customerId },
        data: { assigneeId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: ActivityActions.CUSTOMER_ASSIGNED,
          customerId,
          metadata: {
            customerName: customer.name,
            assigneeName: assignee.name,
          },
        },
      });

      return updated;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function unassignCustomer(organizationId: string, actorId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!customer) throw new Error("Customer not found.");

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { assigneeId: null },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    organizationId,
    actorId,
    action: ActivityActions.CUSTOMER_UNASSIGNED,
    customerId,
    metadata: { customerName: customer.name },
  });

  return updated;
}

export async function getDashboardStats(organizationId: string) {
  if (!organizationId) {
    throw new Error("Organization ID is required for isolation.");
  }
  const [total, activeAssigned, unassigned, teamMembers] = await Promise.all([
    prisma.customer.count({ where: { organizationId, deletedAt: null } }),
    prisma.customer.count({
      where: { organizationId, deletedAt: null, assigneeId: { not: null } },
    }),
    prisma.customer.count({
      where: { organizationId, deletedAt: null, assigneeId: null },
    }),
    prisma.user.count({ where: { organizationId, deletedAt: null } }),
  ]);

  return { totalCustomers: total, activeAssigned, unassigned, teamMembers };
}

export async function getTopAssignees(organizationId: string, limit = 5) {
  const grouped = await prisma.customer.groupBy({
    by: ["assigneeId"],
    where: {
      organizationId,
      deletedAt: null,
      assigneeId: { not: null },
    },
    _count: { assigneeId: true },
    orderBy: { _count: { assigneeId: "desc" } },
    take: limit,
  });

  const ids = grouped.map((g) => g.assigneeId).filter((id): id is string => id !== null);
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids }, organizationId },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return grouped.map((g) => ({
    userId: g.assigneeId as string,
    name: nameById.get(g.assigneeId as string) ?? "User",
    count: g._count.assigneeId,
  }));
}

export async function getCustomerCounts(organizationId: string, customerId: string) {
  const [notesCount, activitiesCount] = await Promise.all([
    prisma.note.count({
      where: { organizationId, customerId, deletedAt: null },
    }),
    prisma.activityLog.count({
      where: { organizationId, customerId, deletedAt: null },
    }),
  ]);
  return { notesCount, activitiesCount };
}
