import { EntriesTable } from "@/components/entries/entries-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listArchivedEntries } from "@/lib/entries";
import { requireUser } from "@/lib/session";

export default async function ArchivePage() {
  const user = await requireUser();
  const entries = await listArchivedEntries();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="section-eyebrow">Historical Records</p>
          <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">Archived Entries</CardTitle>
          <CardDescription className="mt-3 max-w-3xl">
            Archived entries are preserved after a completed weekly report run and remain available for internal reference.
          </CardDescription>
        </CardHeader>
      </Card>

      <EntriesTable
        entries={entries}
        role={user.role}
        title="Archived Event Entries"
        description="Search and review historical records preserved after prior business weeks were closed."
      />
    </div>
  );
}
