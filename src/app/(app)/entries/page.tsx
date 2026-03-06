import { EventEntryForm } from "@/components/entries/event-entry-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export default async function EntriesPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="section-eyebrow">Submission Workspace</p>
          <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">New Event Entry</CardTitle>
          <CardDescription className="mt-3 max-w-3xl">
            Complete the three cards below, review the full record, then submit the entry into the weekly register.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventEntryForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
