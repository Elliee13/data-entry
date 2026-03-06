import type { Prisma } from "@/generated/prisma/client";
import { AuditAction } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { getBusinessWeekForDate } from "@/lib/time";
import { eventEntrySchema, type EventEntryInput } from "@/lib/validation/event-entry";

const entrySelect = {
  id: true,
  eventName: true,
  location: true,
  eventDate: true,
  weather: true,
  coordinator: true,
  sport: true,
  shirtColor: true,
  totalTeams: true,
  totalShirts: true,
  shirtsSold: true,
  totalSales: true,
  costOfProduct: true,
  laborCost: true,
  travelCost: true,
  age5u: true,
  age6u: true,
  age7u: true,
  age8u: true,
  age9u: true,
  age10u: true,
  age11u: true,
  age12u: true,
  age13u: true,
  age14u: true,
  age15u: true,
  age16u: true,
  weekKey: true,
  weekStartsAt: true,
  weekEndsAt: true,
  isArchived: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  archivedByReport: {
    select: {
      id: true,
      status: true,
      sentAt: true,
    },
  },
} satisfies Prisma.EventEntrySelect;

type EntryRecord = Prisma.EventEntryGetPayload<{ select: typeof entrySelect }>;

function toMoney(value: number) {
  return value.toFixed(2);
}

function serializeEntry(entry: EntryRecord) {
  return {
    ...entry,
    totalSales: Number(entry.totalSales),
    costOfProduct: Number(entry.costOfProduct),
    laborCost: Number(entry.laborCost),
    travelCost: Number(entry.travelCost),
  };
}

export type SerializedEntry = ReturnType<typeof serializeEntry>;

function buildEntryData(input: EventEntryInput) {
  const week = getBusinessWeekForDate(input.eventDate);

  return {
    ...input,
    totalSales: toMoney(input.totalSales),
    costOfProduct: toMoney(input.costOfProduct),
    laborCost: toMoney(input.laborCost),
    travelCost: toMoney(input.travelCost),
    weekKey: week.weekKey,
    weekStartsAt: week.weekStartsAt,
    weekEndsAt: week.weekEndsAt,
  };
}

export async function listCurrentWeekEntries() {
  const entries = await db.eventEntry.findMany({
    where: {
      deletedAt: null,
      isArchived: false,
    },
    select: entrySelect,
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });

  return entries.map(serializeEntry);
}

export async function listArchivedEntries() {
  const entries = await db.eventEntry.findMany({
    where: {
      isArchived: true,
      deletedAt: null,
    },
    select: entrySelect,
    orderBy: [{ weekStartsAt: "desc" }, { eventDate: "asc" }],
  });

  return entries.map(serializeEntry);
}

export async function getEntryById(entryId: string) {
  const entry = await db.eventEntry.findFirst({
    where: {
      id: entryId,
      deletedAt: null,
    },
    select: entrySelect,
  });

  return entry ? serializeEntry(entry) : null;
}

export async function createEventEntry(input: unknown, actorUserId: string) {
  const parsed = eventEntrySchema.parse(input);
  const data = buildEntryData(parsed);

  const entry = await db.eventEntry.create({
    data: {
      ...data,
      createdById: actorUserId,
    },
    select: entrySelect,
  });

  await createAuditLog({
    action: AuditAction.ENTRY_CREATED,
    entityType: "event_entry",
    entityId: entry.id,
    actorUserId,
    metadata: {
      weekKey: entry.weekKey,
      eventDate: entry.eventDate,
      eventName: entry.eventName,
    },
  });

  return serializeEntry(entry);
}

export async function updateEventEntry(entryId: string, input: unknown, actorUserId: string) {
  const existingEntry = await db.eventEntry.findFirst({
    where: {
      id: entryId,
      deletedAt: null,
    },
    select: {
      id: true,
      isArchived: true,
    },
  });

  if (!existingEntry) {
    throw new Error("Entry not found.");
  }

  if (existingEntry.isArchived) {
    throw new Error("Archived entries cannot be edited.");
  }

  const parsed = eventEntrySchema.parse(input);
  const data = buildEntryData(parsed);

  const entry = await db.eventEntry.update({
    where: { id: entryId },
    data: {
      ...data,
      updatedById: actorUserId,
    },
    select: entrySelect,
  });

  await createAuditLog({
    action: AuditAction.ENTRY_UPDATED,
    entityType: "event_entry",
    entityId: entry.id,
    actorUserId,
    metadata: {
      weekKey: entry.weekKey,
      eventDate: entry.eventDate,
      eventName: entry.eventName,
    },
  });

  return serializeEntry(entry);
}

export async function deleteEventEntry(entryId: string, actorUserId: string) {
  const existingEntry = await db.eventEntry.findFirst({
    where: {
      id: entryId,
      deletedAt: null,
    },
    select: {
      id: true,
      isArchived: true,
      eventName: true,
      weekKey: true,
    },
  });

  if (!existingEntry) {
    throw new Error("Entry not found.");
  }

  if (existingEntry.isArchived) {
    throw new Error("Archived entries cannot be deleted.");
  }

  await db.eventEntry.update({
    where: { id: entryId },
    data: {
      deletedAt: new Date(),
      deletedById: actorUserId,
    },
  });

  await createAuditLog({
    action: AuditAction.ENTRY_DELETED,
    entityType: "event_entry",
    entityId: entryId,
    actorUserId,
    metadata: {
      weekKey: existingEntry.weekKey,
      eventName: existingEntry.eventName,
    },
  });
}
