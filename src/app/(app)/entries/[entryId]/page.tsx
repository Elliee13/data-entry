import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteEntryButton } from "@/components/entries/delete-entry-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntryById } from "@/lib/entries";
import { requireUser } from "@/lib/session";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

type EntryPageProps = {
  params: Promise<{ entryId: string }>;
};

export default async function EntryDetailPage({ params }: EntryPageProps) {
  const user = await requireUser();
  const { entryId } = await params;
  const entry = await getEntryById(entryId);

  if (!entry) {
    notFound();
  }

  const pairs = [
    ["Event Name", entry.eventName],
    ["Location", entry.location],
    ["Date", entry.eventDate],
    ["Weather", entry.weather],
    ["Coordinator", entry.coordinator],
    ["Sport", entry.sport],
    ["Shirt Color", entry.shirtColor],
    ["Total Teams", entry.totalTeams.toString()],
    ["Total Shirts", entry.totalShirts.toString()],
    ["Shirts Sold", entry.shirtsSold.toString()],
    ["Total Sales", formatCurrency(entry.totalSales)],
    ["Cost of Product", formatCurrency(entry.costOfProduct)],
    ["Labor Cost", formatCurrency(entry.laborCost)],
    ["Travel", formatCurrency(entry.travelCost)],
    ["5u", entry.age5u.toString()],
    ["6u", entry.age6u.toString()],
    ["7u", entry.age7u.toString()],
    ["8u", entry.age8u.toString()],
    ["9u", entry.age9u.toString()],
    ["10u", entry.age10u.toString()],
    ["11u", entry.age11u.toString()],
    ["12u", entry.age12u.toString()],
    ["13u", entry.age13u.toString()],
    ["14u", entry.age14u.toString()],
    ["15u", entry.age15u.toString()],
    ["16u", entry.age16u.toString()],
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-eyebrow">Entry Detail</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <CardTitle className="text-3xl tracking-[-0.04em]">{entry.eventName}</CardTitle>
              <Badge variant={entry.isArchived ? "success" : "warning"}>
                {entry.isArchived ? "Archived" : "Active"}
              </Badge>
            </div>
            <CardDescription className="mt-3">
              Created by {entry.createdBy.name} on {formatDateTime(entry.createdAt)}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={entry.isArchived ? "/archive" : "/entries"} className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            {user.role === "ADMIN" && !entry.isArchived ? (
              <>
                <Link href={`/entries/${entry.id}/edit`} className={cn(buttonVariants(), "shadow-[var(--shadow-button)]")}>
                  Edit Entry
                </Link>
                <DeleteEntryButton entryId={entry.id} />
              </>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-3">
          {pairs.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
