"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CircleDollarSign, Package2 } from "lucide-react";
import { AGE_DIVISION_FIELDS } from "@/lib/constants";
import { eventEntrySchema } from "@/lib/validation/event-entry";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type FormMode = "create" | "edit";

type FormValues = {
  eventName: string;
  location: string;
  eventDate: string;
  weather: string;
  coordinator: string;
  sport: string;
  shirtColor: string;
  totalTeams: string;
  totalShirts: string;
  shirtsSold: string;
  totalSales: string;
  costOfProduct: string;
  laborCost: string;
  travelCost: string;
  age5u: string;
  age6u: string;
  age7u: string;
  age8u: string;
  age9u: string;
  age10u: string;
  age11u: string;
  age12u: string;
  age13u: string;
  age14u: string;
  age15u: string;
  age16u: string;
};

type EventEntryFormProps = {
  mode: FormMode;
  entryId?: string;
  initialValues?: Partial<FormValues>;
  submitLabel?: string;
};

type FieldConfig = {
  name: keyof FormValues;
  label: string;
  type: string;
  step?: string;
  hint?: string;
};

const defaultValues: FormValues = {
  eventName: "",
  location: "",
  eventDate: "",
  weather: "",
  coordinator: "",
  sport: "",
  shirtColor: "",
  totalTeams: "0",
  totalShirts: "0",
  shirtsSold: "0",
  totalSales: "0",
  costOfProduct: "0",
  laborCost: "0",
  travelCost: "0",
  age5u: "0",
  age6u: "0",
  age7u: "0",
  age8u: "0",
  age9u: "0",
  age10u: "0",
  age11u: "0",
  age12u: "0",
  age13u: "0",
  age14u: "0",
  age15u: "0",
  age16u: "0",
};

const coreFields: FieldConfig[] = [
  { name: "eventName", label: "Event Name", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "eventDate", label: "Date", type: "date" },
  { name: "weather", label: "Weather", type: "text" },
  { name: "coordinator", label: "Coordinator", type: "text" },
  { name: "sport", label: "Sport", type: "text" },
  { name: "shirtColor", label: "Shirt Color", type: "text" },
];

const financeFields: FieldConfig[] = [
  { name: "totalTeams", label: "Total Teams", type: "number", step: "1" },
  { name: "totalShirts", label: "Total Shirts", type: "number", step: "1" },
  { name: "shirtsSold", label: "Shirts Sold", type: "number", step: "1", hint: "Cannot exceed total shirts." },
  { name: "totalSales", label: "Total Sales ($)", type: "number", step: "0.01" },
  { name: "costOfProduct", label: "Cost of Product ($)", type: "number", step: "0.01" },
  { name: "laborCost", label: "Labor Cost ($)", type: "number", step: "0.01" },
  { name: "travelCost", label: "Travel ($)", type: "number", step: "0.01" },
];

const ageDivisionFields: FieldConfig[] = AGE_DIVISION_FIELDS.map((field) => ({
  name: field,
  label: field.replace("age", "").toUpperCase(),
  type: "number",
  step: "1",
}));

export function EventEntryForm({
  mode,
  entryId,
  initialValues,
  submitLabel = mode === "create" ? "Create Entry" : "Save Changes",
}: EventEntryFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewData, setReviewData] = useState<ReturnType<typeof eventEntrySchema.parse> | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summaryRows = reviewData
    ? [
        ["Event Name", reviewData.eventName],
        ["Location", reviewData.location],
        ["Date", reviewData.eventDate],
        ["Weather", reviewData.weather],
        ["Coordinator", reviewData.coordinator],
        ["Sport", reviewData.sport],
        ["Shirt Color", reviewData.shirtColor],
        ["Total Teams", reviewData.totalTeams.toString()],
        ["Total Shirts", reviewData.totalShirts.toString()],
        ["Shirts Sold", reviewData.shirtsSold.toString()],
        ["Total Sales", formatCurrency(reviewData.totalSales)],
        ["Cost of Product", formatCurrency(reviewData.costOfProduct)],
        ["Labor Cost", formatCurrency(reviewData.laborCost)],
        ["Travel", formatCurrency(reviewData.travelCost)],
        ...AGE_DIVISION_FIELDS.map((field) => [field.replace("age", "").toUpperCase(), reviewData[field].toString()]),
      ]
    : [];

  function handleChange(name: keyof FormValues, nextValue: string) {
    setValues((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  function openReview() {
    setSubmitError(null);
    const parsed = eventEntrySchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string" && !nextErrors[fieldName]) {
          nextErrors[fieldName] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setReviewData(parsed.data);
  }

  async function submitEntry() {
    if (!reviewData) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const response = await fetch(mode === "create" ? "/api/entries" : `/api/entries/${entryId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setSubmitError(payload?.error ?? "The request could not be completed.");
      return;
    }

    setReviewData(null);
    router.push(mode === "create" ? "/dashboard" : `/entries/${entryId}`);
    router.refresh();
  }

  function renderField(field: FieldConfig) {
    return (
      <label key={field.name} className="block space-y-2">
        <span className="field-label">{field.label}</span>
        <Input
          type={field.type}
          min={field.type === "number" ? "0" : undefined}
          step={field.step}
          value={values[field.name]}
          onChange={(event) => handleChange(field.name, event.target.value)}
        />
        {field.hint ? <p className="text-xs text-[var(--muted-foreground)]">{field.hint}</p> : null}
        {errors[field.name] ? <p className="field-error">{errors[field.name]}</p> : null}
      </label>
    );
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.9fr]">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Event Core</CardTitle>
              <CardDescription>Capture the operational details that define each event submission.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {coreFields.map(renderField)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Finance</CardTitle>
              <CardDescription>Track counts, shirt movement, and cost figures for weekly reporting.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {financeFields.map(renderField)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Age Divisions</CardTitle>
              <CardDescription>Capture team distribution by age bracket in a compact operational grid.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            {ageDivisionFields.map(renderField)}
          </CardContent>
        </Card>
      </div>

      {submitError ? (
        <div className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
          {submitError}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--card)] px-5 py-5 shadow-[var(--shadow-card)]">
        <div>
          <p className="section-eyebrow">Review Required</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            Validate the full submission before saving. The review modal summarizes every field exactly as it will be stored.
          </p>
        </div>
        <Button size="lg" onClick={openReview}>
          Review and Submit
        </Button>
      </div>

      <Dialog open={Boolean(reviewData)} onOpenChange={(open) => (!open ? setReviewData(null) : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <p className="section-eyebrow">Confirmation</p>
            <DialogTitle>Review Before Submission</DialogTitle>
            <DialogDescription>
              Confirm the values below before {mode === "create" ? "creating" : "updating"} the event entry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaryRows.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
              {submitError}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewData(null)}>
              Back to Editing
            </Button>
            <Button onClick={submitEntry} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
