import type { DefaultSession } from "next-auth";

/**
 * Shared application types. Import from `@/types`.
 */

// --- CRM records ---
export interface CustomerRecord {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  assigneeId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Customer row from list API (JSON-serialized dates). */
export interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  assigneeId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; email: string } | null;
}

export interface NoteRecord {
  id: string;
  customerId: string;
  organizationId: string;
  authorId: string;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Auth ---
export type UserRole = "ADMIN" | "USER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

// --- NextAuth (module augmentation) ---
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      organizationId: string;
      organizationName: string;
    };
  }

  interface User {
    role: string;
    organizationId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    organizationId?: string;
    organizationName?: string;
  }
}
