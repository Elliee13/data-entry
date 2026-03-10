import { type NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { AuditAction } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

type AuditContext = {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export function getRequestContext(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function createAuditLog(context: AuditContext) {
  await db.auditLog.create({
    data: {
      action: context.action,
      entityType: context.entityType,
      entityId: context.entityId,
      actorUserId: context.actorUserId,
      actorEmail: context.actorEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: context.metadata,
    },
  });
}

export async function listAuditLogs() {
  return db.auditLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorEmail: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
      actorUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function listAuditLogsForEntity(entityType: string, entityId: string) {
  return db.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorEmail: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
      actorUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function listEntryHistoryLogs() {
  const logs = await db.auditLog.findMany({
    where: {
      entityType: "event_entry",
      action: {
        in: [AuditAction.ENTRY_CREATED, AuditAction.ENTRY_UPDATED, AuditAction.ENTRY_DELETED],
      },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorEmail: true,
      metadata: true,
      createdAt: true,
      actorUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const entityIds = Array.from(new Set(logs.map((log) => log.entityId).filter((entityId): entityId is string => Boolean(entityId))));
  const existingEntries = entityIds.length
    ? await db.eventEntry.findMany({
        where: {
          id: {
            in: entityIds,
          },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      })
    : [];
  const existingEntryIds = new Set(existingEntries.map((entry) => entry.id));

  return logs.map((log) => ({
    ...log,
    entityExists: log.entityId ? existingEntryIds.has(log.entityId) : false,
  }));
}
