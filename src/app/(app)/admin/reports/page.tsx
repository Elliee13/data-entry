import { ReportHistory } from "@/components/admin/report-history";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { listWeeklyReports } from "@/lib/reports";
import { requireAdminUser } from "@/lib/session";
import { getPreviousBusinessWeek } from "@/lib/time";

export default async function AdminReportsPage() {
  await requireAdminUser();

  const reports = await listWeeklyReports();
  const previousBusinessWeek = getPreviousBusinessWeek();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
        <p className="section-eyebrow">Administration</p>
        <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">Weekly Report History</CardTitle>
        </CardHeader>
      </Card>

      <ReportHistory reports={reports} defaultWeekKey={previousBusinessWeek.weekKey} />
    </div>
  );
}
