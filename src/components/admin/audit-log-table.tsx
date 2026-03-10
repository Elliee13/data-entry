"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

type AuditLogRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: Date;
  actorUser: {
    name: string;
    email: string;
  } | null;
};

type AuditLogTableProps = {
  logs: AuditLogRecord[];
};

type SortKey = "action" | "entityType" | "actorEmail" | "createdAt";

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

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  function handleSort(nextSortKey: SortKey) {
    setPage(1);

    if (nextSortKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setDirection(nextSortKey === "createdAt" ? "desc" : "asc");
  }

  const filteredLogs = logs.filter((log) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return [
      log.action,
      log.entityType,
      log.entityId ?? "",
      log.actorUser?.name ?? "",
      log.actorUser?.email ?? "",
      log.actorEmail ?? "",
      log.ipAddress ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const sortedLogs = [...filteredLogs].sort((left, right) => {
    if (sortKey === "createdAt") {
      return direction === "asc"
        ? new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    const leftValue = sortKey === "actorEmail" ? left.actorUser?.email ?? left.actorEmail ?? "" : left[sortKey];
    const rightValue = sortKey === "actorEmail" ? right.actorUser?.email ?? right.actorEmail ?? "" : right[sortKey];

    return direction === "asc"
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue));
  });

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card className="overflow-hidden rounded-md border shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">System Audit Log</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and review the recorded operational trail without modifying the underlying events.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search action, actor, entity, IP..."
            className="h-9 rounded-md bg-background pl-9 shadow-none"
          />
        </div>
      </div>

      <div className="max-h-[24rem] overflow-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <SortButton label="Action" column="action" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Entity" column="entityType" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Actor" column="actorEmail" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>
                <SortButton label="Created" column="createdAt" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] tracking-normal">
                    {log.action.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-[var(--foreground)]">{log.entityType}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{log.entityId ?? "No entity id"}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-[var(--foreground)]">{log.actorUser?.name ?? "System"}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {log.actorUser?.email ?? log.actorEmail ?? "No actor email"}
                  </p>
                </TableCell>
                <TableCell>
                  <pre className="max-w-[22rem] overflow-hidden text-ellipsis whitespace-pre-wrap text-xs leading-6 text-[var(--muted-foreground)]">
                    {log.metadata ? JSON.stringify(log.metadata, null, 2) : "No metadata"}
                  </pre>
                </TableCell>
                <TableCell className="text-xs leading-6 text-[var(--muted-foreground)]">
                  <div>{log.ipAddress ?? "No IP"}</div>
                  <div className="mt-1 max-w-[16rem] overflow-hidden text-ellipsis">{log.userAgent ?? "No user agent"}</div>
                </TableCell>
                <TableCell className="text-[var(--muted-foreground)]">{formatDateTime(log.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={sortedLogs.length}
        itemLabel="audit log rows"
        onPageChange={setPage}
      />
    </Card>
  );
}
