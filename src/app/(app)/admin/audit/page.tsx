import { AuditLogTable } from "@/components/admin/audit-log-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuditLogs } from "@/lib/audit";
import { requireAdminUser } from "@/lib/session";

export default async function AdminAuditPage() {
  await requireAdminUser();

  const logs = await listAuditLogs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="section-eyebrow">Administration</p>
          <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">Audit Logs</CardTitle>
          <CardDescription className="mt-3 max-w-3xl">
            Review the recorded activity trail for authentication, entry updates, report generation, and archival events.
          </CardDescription>
        </CardHeader>
      </Card>

      <AuditLogTable logs={logs} />
    </div>
  );
}
