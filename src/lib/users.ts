import { AuditAction, UserRole } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createUserSchema, updateUserSchema } from "@/lib/validation/user";

export async function listUsers() {
  return db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function ensureAnotherActiveAdminExists(userId: string) {
  const adminCount = await db.user.count({
    where: {
      id: { not: userId },
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  if (adminCount === 0) {
    throw new Error("At least one active admin user must remain.");
  }
}

export async function createApprovedUser(input: unknown, actorUserId: string) {
  const parsed = createUserSchema.parse(input);
  const passwordHash = await hashPassword(parsed.password);

  const user = await db.user.create({
    data: {
      email: parsed.email,
      name: parsed.name,
      passwordHash,
      role: parsed.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    action: AuditAction.USER_CREATED,
    entityType: "user",
    entityId: user.id,
    actorUserId,
    metadata: {
      email: user.email,
      role: user.role,
    },
  });

  return user;
}

export async function updateApprovedUser(userId: string, input: unknown, actorUserId: string) {
  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!existingUser) {
    throw new Error("User not found.");
  }

  const parsed = updateUserSchema.parse(input);

  if (
    existingUser.role === UserRole.ADMIN &&
    ((parsed.role && parsed.role !== UserRole.ADMIN) || parsed.isActive === false)
  ) {
    await ensureAnotherActiveAdminExists(userId);
  }

  const passwordHash = parsed.password ? await hashPassword(parsed.password) : undefined;

  const user = await db.user.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      role: parsed.role,
      isActive: parsed.isActive,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    action: user.isActive ? AuditAction.USER_UPDATED : AuditAction.USER_DEACTIVATED,
    entityType: "user",
    entityId: user.id,
    actorUserId,
    metadata: {
      role: user.role,
      isActive: user.isActive,
    },
  });

  return user;
}
