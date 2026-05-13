import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export interface LogActivityInput {
  organizationId: string;
  actorId: string | null;
  action: string;
  customerId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.activityLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      customerId: input.customerId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export interface ListActivitiesParams {
  organizationId: string;
  page: number;
  pageSize: number;
  customerId?: string | null;
  actorId?: string | null;
  action?: string | null;
  entityType?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export async function listActivities(params: ListActivitiesParams) {
  const skip = (params.page - 1) * params.pageSize;
  const where: Prisma.ActivityLogWhereInput = {
    organizationId: params.organizationId,
    deletedAt: null,
  };

  if (params.customerId) {
    where.customerId = params.customerId;
  }
  if (params.actorId) {
    where.actorId = params.actorId;
  }
  if (params.action && params.action !== "all") {
    where.action = params.action;
  }
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = params.dateFrom;
    if (params.dateTo) where.createdAt.lte = params.dateTo;
  }

  if (params.entityType && params.entityType !== "all") {
    const map: Record<string, string[]> = {
      Customer: [
        "CUSTOMER_CREATED",
        "CUSTOMER_UPDATED",
        "CUSTOMER_DELETED",
        "CUSTOMER_RESTORED",
        "CUSTOMER_ASSIGNED",
        "CUSTOMER_UNASSIGNED",
      ],
      Note: ["NOTE_ADDED"],
    };
    const actions = map[params.entityType];
    if (actions) {
      where.action = { in: actions };
    }
  }

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: params.pageSize,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, deletedAt: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { items, total, page: params.page, pageSize: params.pageSize };
}
