"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Search } from "lucide-react";
import { type UserRole } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SerializedEntry } from "@/lib/entries";
import { formatCurrency, formatInteger } from "@/lib/utils";

type EntriesTableProps = {
  entries: SerializedEntry[];
  role: UserRole;
  title?: string;
  description?: string;
};

type SortKey = "eventName" | "location" | "totalTeams" | "shirtsSold" | "totalSales" | "eventDate";

const PAGE_SIZE = 8;

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

export function EntriesTable({
  entries,
  role,
  title = "Recent Event Entries",
  description = "Monitor active submissions with quick access to review and administrative actions.",
}: EntriesTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("eventDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    if (!normalizedQuery) {
      return true;
    }

    return [entry.eventName, entry.location, entry.coordinator, entry.sport, entry.eventDate]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const sortedEntries = [...filteredEntries].sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
    }

    return direction === "asc"
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue));
  });

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(nextSortKey: SortKey) {
    setPage(1);

    if (nextSortKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setDirection(nextSortKey === "eventName" || nextSortKey === "location" ? "asc" : "desc");
  }

  if (entries.length === 0) {
    return (
      <div className="surface-inner p-8">
        <p className="section-eyebrow">Entries</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">No entries are available for this view.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border bg-card shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="w-full max-w-sm">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search event, location, coordinator, sport..."
              className="h-9 rounded-md bg-background pl-9 shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[24rem] overflow-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <SortButton label="Event" column="eventName" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Location" column="location" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Teams" column="totalTeams" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Shirts" column="shirtsSold" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Sales" column="totalSales" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton label="Date" column="eventDate" sortKey={sortKey} direction={direction} onSort={handleSort} />
              </TableHead>
              <TableHead className="sticky right-0 w-[88px] bg-card text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{entry.eventName}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {entry.coordinator} · {entry.sport}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] tracking-normal">
                      {entry.isArchived ? "Archived" : "Active"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.location}</TableCell>
                <TableCell className="text-right font-medium">{formatInteger(entry.totalTeams)}</TableCell>
                <TableCell className="text-right font-medium">{formatInteger(entry.shirtsSold)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(entry.totalSales)}</TableCell>
                <TableCell className="text-muted-foreground">{entry.eventDate}</TableCell>
                <TableCell className="sticky right-0 bg-card text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md text-muted-foreground"
                        aria-label={`Open actions for ${entry.eventName}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => router.push(`/entries/${entry.id}`)}>View details</DropdownMenuItem>
                      {role === "ADMIN" && !entry.isArchived ? (
                        <DropdownMenuItem onSelect={() => router.push(`/entries/${entry.id}/edit`)}>
                          Edit entry
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={sortedEntries.length}
        itemLabel="entries"
        onPageChange={setPage}
      />
    </section>
  );
}
