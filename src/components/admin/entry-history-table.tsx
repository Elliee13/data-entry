"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuditAction } from "@/generated/prisma/enums";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";

type EntryHistoryLog = {
  id: string;
  action: string;
  entityId: string | null;
  entityExists: boolean;
  actorEmail: string | null;
  metadata: unknown;
  createdAt: Date;
  actorUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type EntryHistoryTableProps = {
  logs: EntryHistoryLog[];
};

type SortKey = "eventName" | "action" | "actor" | "changedFieldCount" | "createdAt";

type EntryHistoryMetadata = {
  weekKey?: string;
  eventDate?: string;
  eventName?: string;
  editedOnBehalfOfName?: string | null;
  changedFieldCount?: number;
  changes?: Array<{ label?: string }>;
};

const PAGE_SIZE = 10;

function SortButton({
  label,
  column,
  sortKey,
  direction,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortKey === column;
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button className="inline-flex items-center gap-1" onClick={() => onSort(column)}>
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function getMetadata(log: EntryHistoryLog) {
  return (log.metadata ?? {}) as EntryHistoryMetadata;
}

function getChangedFieldCount(log: EntryHistoryLog) {
  const metadata = getMetadata(log);

  if (typeof metadata.changedFieldCount === "number") {
    return metadata.changedFieldCount;
  }

  return Array.isArray(metadata.changes) ? metadata.changes.length : 0;
}

export function EntryHistoryTable({ logs }: EntryHistoryTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  function handleSort(nextSortKey: SortKey) {
    setPage(1);

    if (nextSortKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setDirection(nextSortKey === "createdAt" ? "desc" : "asc");
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredLogs = logs.filter((log) => {
    const isViewableEntry = log.entityExists && log.action !== AuditAction.ENTRY_DELETED;

    if (!isViewableEntry) {
      return false;
    }

    const metadata = getMetadata(log);
    const changes = Array.isArray(metadata.changes) ? metadata.changes : [];

    if (!normalizedQuery) {
      return true;
    }

    return [
      metadata.eventName ?? "",
      metadata.eventDate ?? "",
      metadata.weekKey ?? "",
      metadata.editedOnBehalfOfName ?? "",
      log.action,
      log.entityId ?? "",
      log.actorUser?.name ?? "",
      log.actorUser?.email ?? "",
      log.actorEmail ?? "",
      ...changes.map((change) => change.label ?? ""),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const sortedLogs = [...filteredLogs].sort((left, right) => {
    const leftMetadata = getMetadata(left);
    const rightMetadata = getMetadata(right);

    const leftValue =
      sortKey === "eventName"
        ? leftMetadata.eventName ?? ""
        : sortKey === "actor"
          ? left.actorUser?.name ?? left.actorUser?.email ?? left.actorEmail ?? ""
          : sortKey === "changedFieldCount"
            ? getChangedFieldCount(left)
            : sortKey === "createdAt"
              ? new Date(left.createdAt).getTime()
              : left.action;

    const rightValue =
      sortKey === "eventName"
        ? rightMetadata.eventName ?? ""
        : sortKey === "actor"
          ? right.actorUser?.name ?? right.actorUser?.email ?? right.actorEmail ?? ""
          : sortKey === "changedFieldCount"
            ? getChangedFieldCount(right)
            : sortKey === "createdAt"
              ? new Date(right.createdAt).getTime()
              : right.action;

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
    }

    return direction === "asc"
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue));
  });

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectablePageLogIds = pageItems
    .filter((log) => Boolean(log.entityId) && log.entityExists && log.action !== AuditAction.ENTRY_DELETED)
    .map((log) => log.id);
  const allPageItemsSelected =
    selectablePageLogIds.length > 0 && selectablePageLogIds.every((logId) => selectedLogIds.includes(logId));
  const selectedEntityIds = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .filter((log) => selectedLogIds.includes(log.id))
            .map((log) => log.entityId)
            .filter((entityId): entityId is string => Boolean(entityId)),
        ),
      ),
    [logs, selectedLogIds],
  );

  return (
    <Card className="overflow-hidden rounded-md border shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Entry Change Trail</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review entry creation, admin edits, and deletions in one place without opening each row individually.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
          {isDeletingSelected ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Processing delete request...
            </div>
          ) : null}
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search event, actor, week, field..."
              className="h-9 rounded-md bg-background pl-9 shadow-none"
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md bg-background shadow-none"
                disabled={selectedEntityIds.length === 0 || isDeletingSelected}
              >
                {isDeletingSelected ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeletingSelected ? "Deleting..." : `Delete Selected (${selectedEntityIds.length})`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete selected entries?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedEntityIds.length === 0
                    ? "Select one or more active entry history rows to continue."
                    : `This will remove ${selectedEntityIds.length} entr${selectedEntityIds.length === 1 ? "y" : "ies"} tied to the selected history rows and record the action in the audit log.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingSelected}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setIsDeletingSelected(true);

                    const response = await fetch("/api/entries/bulk-delete", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        entryIds: selectedEntityIds,
                      }),
                    });

                    const payload = (await response.json().catch(() => null)) as { error?: string; deletedCount?: number; skippedCount?: number } | null;
                    setIsDeletingSelected(false);

                    if (!response.ok) {
                      toast.error("Bulk delete failed", {
                        description: payload?.error ?? "Unable to delete selected entries.",
                      });
                      return;
                    }

                    setSelectedLogIds([]);
                    const deletedCount = payload?.deletedCount ?? 0;
                    const skippedCount = payload?.skippedCount ?? 0;
                    toast.success("Bulk delete completed", {
                      description:
                        skippedCount > 0
                          ? `${deletedCount} entr${deletedCount === 1 ? "y was" : "ies were"} removed and ${skippedCount} missing entr${skippedCount === 1 ? "y was" : "ies were"} skipped.`
                          : `${deletedCount} entr${deletedCount === 1 ? "y was" : "ies were"} removed.`,
                    });
                    router.refresh();
                  }}
                  disabled={selectedEntityIds.length === 0 || isDeletingSelected}
                >
                  {isDeletingSelected ? "Deleting..." : "Delete Selected"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="max-h-[24rem] overflow-auto">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-20 w-[52px] bg-card text-center">
                <input
                  type="checkbox"
                  aria-label="Select all entry history rows on this page"
                  checked={allPageItemsSelected}
                  onChange={(event) => {
                    setSelectedLogIds((current) => {
                      const remainingIds = current.filter((logId) => !selectablePageLogIds.includes(logId));
                      return event.target.checked ? [...remainingIds, ...selectablePageLogIds] : remainingIds;
                    });
                  }}
                  disabled={isDeletingSelected}
                  className="h-4 w-4 rounded border-[var(--input)]"
                />
              </TableHead>
              <TableHead>
                <SortButton label="Event" column="eventName" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Action" column="action" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Edited By" column="actor" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Changed Fields"
                  column="changedFieldCount"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton label="Updated" column="createdAt" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead className="sticky right-0 w-[112px] bg-card text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((log) => {
              const metadata = getMetadata(log);
              const actorName = log.actorUser?.name ?? log.actorUser?.email ?? log.actorEmail ?? "System";
              const submittedBy = metadata.editedOnBehalfOfName ?? "Self";
              const changedFieldCount = getChangedFieldCount(log);
              const isSelected = selectedLogIds.includes(log.id);
              const isDeletedLog = log.action === AuditAction.ENTRY_DELETED;
              const isMissingEntry = !log.entityExists && !isDeletedLog;

              return (
                <TableRow key={log.id}>
                  <TableCell className="sticky left-0 z-10 bg-card text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select history row for ${metadata.eventName ?? "entry"}`}
                      checked={isSelected}
                      onChange={(event) => {
                        setSelectedLogIds((current) => {
                          if (event.target.checked) {
                            return current.includes(log.id) ? current : [...current, log.id];
                          }

                          return current.filter((selectedId) => selectedId !== log.id);
                        });
                      }}
                      disabled={!log.entityId || isDeletedLog || isMissingEntry || isDeletingSelected}
                      className="h-4 w-4 rounded border-[var(--input)]"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-[var(--foreground)]">{metadata.eventName ?? "Untitled event"}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {metadata.eventDate ?? "No event date"} · {metadata.weekKey ?? "No week key"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] tracking-normal">
                      {log.action.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-[var(--foreground)]">{actorName}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {log.actorUser?.email ?? log.actorEmail ?? "No actor email"}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{submittedBy}</TableCell>
                  <TableCell className="text-right font-medium">{changedFieldCount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="sticky right-0 bg-card text-right">
                    {isDeletedLog ? (
                      <span className="text-xs text-muted-foreground">Deleted</span>
                    ) : isMissingEntry ? (
                      <span className="text-xs text-muted-foreground">Missing</span>
                    ) : log.entityId ? (
                      <Link
                        href={`/entries/${log.entityId}#history`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 rounded-md bg-background px-3 shadow-none",
                        )}
                      >
                        View
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8 rounded-md bg-background px-3 shadow-none" disabled>
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={sortedLogs.length}
        itemLabel="history rows"
        onPageChange={setPage}
      />
    </Card>
  );
}
