import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ActivityActions } from "@/lib/constants/crm";

/**
 * Merges Tailwind classes with clsx logic
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

/**
 * Extracts initials from a name or fallback email
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

/**
 * Shared activity log formatter for the UI
 */
export function formatActivityLabel(
  action: string,
  actorName: string | undefined,
  customerName: string | undefined,
  metadata?: any
): string {
  const actor = actorName ?? "Someone";
  const meta = (metadata ?? {}) as Record<string, string>;
  const customer = customerName ?? meta.customerName ?? "record";

  switch (action) {
    case ActivityActions.CUSTOMER_CREATED:
      return `${actor} created customer ${customer}`;
    case ActivityActions.CUSTOMER_UPDATED:
      return `${actor} updated ${customer}`;
    case ActivityActions.CUSTOMER_DELETED:
      return `${actor} deleted ${customer}`;
    case ActivityActions.CUSTOMER_RESTORED:
      return `${actor} restored ${customer}`;
    case ActivityActions.CUSTOMER_ASSIGNED:
      return `${actor} assigned ${customer} to ${meta.assigneeName ?? "user"}`;
    case ActivityActions.CUSTOMER_UNASSIGNED:
      return `${actor} unassigned ${customer}`;
    case ActivityActions.NOTE_ADDED:
      return `${actor} added a note on ${customer}`;
    default:
      return `${actor} · ${action}`;
  }
}
