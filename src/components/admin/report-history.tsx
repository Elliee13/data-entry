"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, LoaderCircle, MoreHorizontal, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

type ReportRecord = {
  id: string;
  weekKey: string;
  status: "PENDING" | "GENERATED" | "SENT" | "FAILED";
  triggerType: "CRON" | "MANUAL" | "RETRY";
  entryCount: number;
  emailTo: string;
  emailSubject: string;
  attemptCount: number;
  sentAt: Date | null;
  archivedAt: Date | null;
  failureMessage: string | null;
  createdAt: Date;
};

type ReportHistoryProps = {
  reports: ReportRecord[];
  defaultWeekKey: string;
};

type SortKey = "weekKey" | "status" | "triggerType" | "entryCount" | "attemptCount" | "createdAt";

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

export function ReportHistory({ reports, defaultWeekKey }: ReportHistoryProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [pendingActionLabel, setPendingActionLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekKey, setSelectedWeekKey] = useState(defaultWeekKey);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  async function triggerManualRun() {
    setIsPending(true);
    setPendingActionLabel("Generating weekly report...");
    setError(null);

    const response = await fetch("/api/admin/reports/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        weekKey: selectedWeekKey || undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsPending(false);
    setPendingActionLabel(null);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to trigger report.");
      toast.error("Report run failed", {
        description: payload?.error ?? "Unable to trigger report.",
      });
      return;
    }

    toast.success("Report generated", {
      description: "The selected weekly report run completed.",
    });
    router.refresh();
  }

  async function retryReport(reportId: string) {
    setIsPending(true);
    setPendingActionLabel("Retrying report...");
    setError(null);

    const response = await fetch(`/api/admin/reports/${reportId}/retry`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsPending(false);
    setPendingActionLabel(null);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to retry report.");
      toast.error("Retry failed", {
        description: payload?.error ?? "Unable to retry report.",
      });
      return;
    }

    toast.success("Report retried", {
      description: "The weekly report retry completed.",
    });
    router.refresh();
  }

  function handleSort(nextSortKey: SortKey) {
    setPage(1);

    if (nextSortKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setDirection(nextSortKey === "weekKey" || nextSortKey === "status" || nextSortKey === "triggerType" ? "asc" : "desc");
  }

  const filteredReports = reports.filter((report) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return [report.weekKey, report.status, report.triggerType, report.emailTo, report.emailSubject, report.failureMessage ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const sortedReports = [...filteredReports].sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];

    if (sortKey === "createdAt") {
      return direction === "asc"
        ? new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
    }

    return direction === "asc"
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue));
  });

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">Reporting Controls</p>
            <CardTitle className="mt-2 text-2xl">Manual Report Operations</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Manual delivery mode is enabled. Pick any date in the target week, run the report, then download the generated files for manual sending.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="date"
              value={selectedWeekKey}
              disabled={isPending}
              onChange={(event) => setSelectedWeekKey(event.target.value)}
              className="w-[12rem]"
            />
            <Button onClick={triggerManualRun} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Run Selected Week"
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}
      {isPending && pendingActionLabel ? (
        <div className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {pendingActionLabel}
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-md border shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Weekly Report Runs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search report history, inspect delivery status, and reopen failed manual runs.
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
              placeholder="Search week, status, subject, recipient..."
              className="h-9 rounded-md bg-background pl-9 shadow-none"
            />
          </div>
        </div>

        <div className="max-h-[24rem] overflow-auto">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <SortButton label="Week" column="weekKey" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Status" column="status" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Trigger" column="triggerType" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton label="Entries" column="entryCount" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton label="Attempts" column="attemptCount" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Created" column="createdAt" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="sticky right-0 w-[88px] bg-card text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold">{report.weekKey}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] tracking-normal">
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.triggerType}</TableCell>
                  <TableCell className="text-right font-medium">{report.entryCount}</TableCell>
                  <TableCell className="text-right font-medium">{report.attemptCount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(report.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {report.sentAt ? formatDateTime(report.sentAt) : report.status === "GENERATED" ? "Manual delivery" : "Not sent"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{report.failureMessage ?? report.emailSubject}</p>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md text-muted-foreground"
                          aria-label={`Open actions for report ${report.weekKey}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => (window.location.href = `/api/admin/reports/${report.id}/download?format=csv`)}>
                          <Download className="h-4 w-4" />
                          Download CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => (window.location.href = `/api/admin/reports/${report.id}/download?format=xlsx`)}>
                          <Download className="h-4 w-4" />
                          Download XLSX
                        </DropdownMenuItem>
                        {report.status === "FAILED" ? (
                          <DropdownMenuItem onSelect={() => retryReport(report.id)} disabled={isPending}>
                            <RefreshCcw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                            {isPending ? "Retrying..." : "Retry Report"}
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
          totalItems={sortedReports.length}
          itemLabel="reports"
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
