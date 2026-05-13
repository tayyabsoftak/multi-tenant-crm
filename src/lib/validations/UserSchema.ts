import { z } from "zod";

export const inviteUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["ADMIN", "USER"]),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
