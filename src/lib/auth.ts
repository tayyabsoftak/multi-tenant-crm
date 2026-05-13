import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";

import { loginSchema } from "@/lib/validations/AuthSchema";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const users = await prisma.user.findMany({
          where: { email, deletedAt: null },
        });

        for (const user of users) {
          if (!user.passwordHash) continue;
          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (valid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              organizationId: user.organizationId,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        const org = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: { name: true },
        });
        token.organizationName = org?.name ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "USER";
        session.user.organizationId = (token.organizationId as string | undefined) ?? "";
        session.user.organizationName = (token.organizationName as string | undefined) ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
