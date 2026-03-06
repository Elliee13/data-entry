import type { AuthOptions } from "next-auth";
import NextAuth from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuditAction } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { getAuthEnv } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

export const authOptions: AuthOptions = {
  secret: getAuthEnv().AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        const rawEmail = credentials?.email?.toLowerCase();
        const ipAddress =
          typeof request.headers?.["x-forwarded-for"] === "string"
            ? request.headers["x-forwarded-for"].split(",")[0]?.trim()
            : null;
        const userAgent =
          typeof request.headers?.["user-agent"] === "string" ? request.headers["user-agent"] : null;

        if (!parsed.success) {
          await createAuditLog({
            action: AuditAction.AUTH_LOGIN_FAILURE,
            entityType: "user",
            actorEmail: rawEmail ?? null,
            ipAddress,
            userAgent,
            metadata: { reason: "Invalid credential payload." },
          });

          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.isActive) {
          await createAuditLog({
            action: AuditAction.AUTH_LOGIN_FAILURE,
            entityType: "user",
            actorEmail: parsed.data.email,
            ipAddress,
            userAgent,
            metadata: { reason: "User not found or inactive." },
          });

          return null;
        }

        const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!isValidPassword) {
          await createAuditLog({
            action: AuditAction.AUTH_LOGIN_FAILURE,
            entityType: "user",
            entityId: user.id,
            actorUserId: user.id,
            actorEmail: user.email,
            ipAddress,
            userAgent,
            metadata: { reason: "Invalid password." },
          });

          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await createAuditLog({
          action: AuditAction.AUTH_LOGIN_SUCCESS,
          entityType: "user",
          entityId: user.id,
          actorUserId: user.id,
          actorEmail: user.email,
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.sub) {
        return;
      }

      await createAuditLog({
        action: AuditAction.AUTH_LOGOUT,
        entityType: "user",
        entityId: token.sub,
        actorUserId: token.sub,
        actorEmail: token.email ?? null,
      });
    },
  },
};

export const authHandler = NextAuth(authOptions);

export function auth() {
  return getServerSession(authOptions);
}
