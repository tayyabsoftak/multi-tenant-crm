/** Max active (non-deleted) customers a single user may have assigned at once. */
export const MAX_ACTIVE_ASSIGNMENTS_PER_USER = 5;

export const ActivityActions = {
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  CUSTOMER_UPDATED: "CUSTOMER_UPDATED",
  CUSTOMER_DELETED: "CUSTOMER_DELETED",
  CUSTOMER_RESTORED: "CUSTOMER_RESTORED",
  CUSTOMER_ASSIGNED: "CUSTOMER_ASSIGNED",
  CUSTOMER_UNASSIGNED: "CUSTOMER_UNASSIGNED",
  NOTE_ADDED: "NOTE_ADDED",
} as const;

export type ActivityAction = (typeof ActivityActions)[keyof typeof ActivityActions];
