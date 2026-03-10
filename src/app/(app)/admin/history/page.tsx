import { EntryHistoryTable } from "@/components/admin/entry-history-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listEntryHistoryLogs } from "@/lib/audit";
import { requireAdminUser } from "@/lib/session";

export default async function AdminEntryHistoryPage() {
  await requireAdminUser();

  const logs = await listEntryHistoryLogs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="section-eyebrow">Administration</p>
          <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">Entry History</CardTitle>
          <CardDescription className="mt-3 max-w-3xl">
            Review the entry-level change trail across created, edited, and deleted submissions. Use this page when you
            need a broader audit view than a single entry detail screen.
          </CardDescription>
        </CardHeader>
      </Card>

      <EntryHistoryTable logs={logs} />
    </div>
  );
}
