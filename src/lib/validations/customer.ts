import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional().or(z.literal("")),
  assigneeId: z.string().cuid().nullable().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).nullable().optional().or(z.literal("")),
  assigneeId: z.string().cuid().nullable().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
