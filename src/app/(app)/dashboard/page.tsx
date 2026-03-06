import Link from "next/link";
import { ArrowRight, Archive, FileSpreadsheet, Plus } from "lucide-react";
import { EntriesTable } from "@/components/entries/entries-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCurrentWeekEntries } from "@/lib/entries";
import { requireUser } from "@/lib/session";
import { getCurrentBusinessWeek } from "@/lib/time";
import { cn, formatCurrency, formatInteger } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const currentWeek = getCurrentBusinessWeek();
  const entries = await listCurrentWeekEntries();

  const summary = entries.reduce(
    (accumulator, entry) => {
      accumulator.events += 1;
      accumulator.teams += entry.totalTeams;
      accumulator.sales += entry.totalSales;
      accumulator.shirts += entry.shirtsSold;
      return accumulator;
    },
    { events: 0, teams: 0, sales: 0, shirts: 0 },
  );

  const statCards = [
    {
      label: "Events This Week",
      value: formatInteger(summary.events),
      detail: `${entries.length} active rows in the live register`,
    },
    {
      label: "Teams This Week",
      value: formatInteger(summary.teams),
      detail: "Total teams recorded across active entries",
    },
    {
      label: "Shirts Sold",
      value: formatInteger(summary.shirts),
      detail: "Shirt counts captured in active entries",
    },
    {
      label: "Total Sales",
      value: formatCurrency(summary.sales),
      detail: "Combined sales value across active entries",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(320px,1.05fr)_minmax(0,1.55fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-eyebrow">Business Week</p>
                <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">{currentWeek.weekStartLabel}</CardTitle>
                <CardDescription className="mt-2">Through {currentWeek.weekEndLabel}</CardDescription>
              </div>
              <Badge variant="outline">America/New_York</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-[var(--muted-foreground)]">
              The dashboard is currently showing all active non-archived entries for test sanity. Current-week filtering can be restored before production.
            </p>
          </CardContent>
        </Card>

        <div className="grid items-start gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.label} className="h-auto">
              <CardHeader className="gap-2 p-4">
                <CardDescription className="text-[0.66rem] font-semibold uppercase tracking-[0.14em]">
                  {card.label}
                </CardDescription>
                <CardTitle className="text-[2rem] leading-none tracking-[-0.03em]">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-xs leading-5 text-[var(--muted-foreground)]">{card.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <EntriesTable
          entries={entries}
          role={user.role}
          title="Recent Event Entries"
          description="Search, sort, and review active entries from the live weekly register."
        />

        <Card className="h-fit">
          <CardHeader>
            <p className="section-eyebrow">Quick Actions</p>
            <CardTitle className="mt-2 text-2xl">Operator Shortcuts</CardTitle>
            <CardDescription className="mt-2">
              Navigate directly to the most common operational tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/entries" className={cn(buttonVariants({ size: "lg" }), "w-full justify-between")}>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Event Entry
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin/reports"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-between")}
              >
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Generate Weekly Report
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href="/archive"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full justify-between")}
            >
              <span className="inline-flex items-center gap-2">
                <Archive className="h-4 w-4" />
                View Archive
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
