import { z } from "zod";

const phoneRegex = /^[\d\s\-+()]+$/;

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().min(1, "Email is required").email("Invalid email format"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 characters")
    .regex(phoneRegex, "Phone must contain only numbers, spaces, and symbols like +, -, ()")
    .max(20, "Phone number is too long"),
  assigneeId: z.string().nullable().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().trim().min(1, "Email is required").email("Invalid email format").optional(),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 characters")
    .regex(phoneRegex, "Phone must contain only numbers, spaces, and symbols like +, -, ()")
    .max(20, "Phone number is too long")
    .optional(),
  assigneeId: z.string().nullable().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
