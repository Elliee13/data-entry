import { AuditAction } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type EntryAuditLog = {
  id: string;
  action: string;
  createdAt: Date;
  metadata: unknown;
  actorUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  actorEmail: string | null;
};

type EntryAuditHistoryProps = {
  logs: EntryAuditLog[];
};

type AuditChange = {
  field: string;
  label: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
};

function formatAuditValue(value: AuditChange["before"]) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : formatCurrency(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Empty";
  }

  return String(value);
}

export function EntryAuditHistory({ logs }: EntryAuditHistoryProps) {
  if (logs.length === 0) {
    return (
      <Card id="history">
        <CardHeader>
          <p className="section-eyebrow">Audit History</p>
          <CardTitle className="mt-2 text-2xl">Entry Change Log</CardTitle>
          <CardDescription className="mt-2">No audit activity has been recorded for this entry yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card id="history">
      <CardHeader>
        <p className="section-eyebrow">Audit History</p>
        <CardTitle className="mt-2 text-2xl">Entry Change Log</CardTitle>
        <CardDescription className="mt-2">
          Admin edits remain allowed, but every change is recorded here with the acting user and the before/after values.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.map((log) => {
          const metadata = (log.metadata ?? {}) as {
            changedFieldCount?: number;
            changes?: AuditChange[];
            editedOnBehalfOfName?: string | null;
          };
          const changes = Array.isArray(metadata.changes) ? metadata.changes : [];

          return (
            <div key={log.id} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={log.action === AuditAction.ENTRY_UPDATED ? "warning" : "outline"}>
                      {log.action.replaceAll("_", " ")}
                    </Badge>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {log.actorUser?.name ?? log.actorEmail ?? "System"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{formatDateTime(log.createdAt)}</p>
                  {metadata.editedOnBehalfOfName ? (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Edited a record originally submitted by {metadata.editedOnBehalfOfName}.
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  {metadata.changedFieldCount ?? changes.length} field{(metadata.changedFieldCount ?? changes.length) === 1 ? "" : "s"} changed
                </p>
              </div>

              {changes.length > 0 ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {changes.map((change) => (
                    <div key={`${log.id}-${change.field}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        {change.label}
                      </p>
                      <div className="mt-3 grid gap-2 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Before</p>
                          <p className="mt-1 text-[var(--foreground)]">{formatAuditValue(change.before)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">After</p>
                          <p className="mt-1 font-medium text-[var(--foreground)]">{formatAuditValue(change.after)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
