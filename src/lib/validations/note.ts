import { z } from "zod";

export const createNoteSchema = z.object({
  customerId: z.string(),
  content: z.string().min(2).max(2000),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
