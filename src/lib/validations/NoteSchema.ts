import { z } from "zod";

/** Schema for the nested route: POST /api/customers/[id]/notes (customerId from URL). */
export const createNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty").max(5000, "Note too long"),
});

/** Schema for the standalone route: POST /api/notes (customerId from body). */
export const createNoteWithCustomerSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  content: z.string().min(1, "Note content cannot be empty").max(5000, "Note too long"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
