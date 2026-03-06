import { notFound } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { EventEntryForm } from "@/components/entries/event-entry-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntryById } from "@/lib/entries";
import { requireUser } from "@/lib/session";

type EditEntryPageProps = {
  params: Promise<{ entryId: string }>;
};

export default async function EditEntryPage({ params }: EditEntryPageProps) {
  const user = await requireUser();
  const { entryId } = await params;

  if (user.role !== UserRole.ADMIN) {
    notFound();
  }

  const entry = await getEntryById(entryId);

  if (!entry || entry.isArchived) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="section-eyebrow">Administrative Edit</p>
          <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">Update Event Entry</CardTitle>
          <CardDescription className="mt-3">
            Adjust the submission fields below. The existing validation and update rules remain unchanged.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
        <EventEntryForm
          mode="edit"
          entryId={entry.id}
          submitLabel="Save Entry"
          initialValues={{
            eventName: entry.eventName,
            location: entry.location,
            eventDate: entry.eventDate,
            weather: entry.weather,
            coordinator: entry.coordinator,
            sport: entry.sport,
            shirtColor: entry.shirtColor,
            totalTeams: entry.totalTeams.toString(),
            totalShirts: entry.totalShirts.toString(),
            shirtsSold: entry.shirtsSold.toString(),
            totalSales: entry.totalSales.toString(),
            costOfProduct: entry.costOfProduct.toString(),
            laborCost: entry.laborCost.toString(),
            travelCost: entry.travelCost.toString(),
            age5u: entry.age5u.toString(),
            age6u: entry.age6u.toString(),
            age7u: entry.age7u.toString(),
            age8u: entry.age8u.toString(),
            age9u: entry.age9u.toString(),
            age10u: entry.age10u.toString(),
            age11u: entry.age11u.toString(),
            age12u: entry.age12u.toString(),
            age13u: entry.age13u.toString(),
            age14u: entry.age14u.toString(),
            age15u: entry.age15u.toString(),
            age16u: entry.age16u.toString(),
          }}
        />
        </CardContent>
      </Card>
    </div>
  );
}
