import { z } from "zod";

const wholeNumberField = z.coerce
  .number()
  .int("Must be a whole number.")
  .min(0, "Must be 0 or greater.");

const currencyField = z.coerce
  .number()
  .min(0, "Must be 0 or greater.")
  .refine((value) => Number.isFinite(value), "Must be a valid number.");

const textField = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(120, "Keep the value under 120 characters.");

export const eventEntrySchema = z
  .object({
    eventName: textField,
    location: textField,
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
    weather: textField,
    coordinator: textField,
    sport: textField,
    shirtColor: textField,
    totalTeams: wholeNumberField,
    totalShirts: wholeNumberField,
    shirtsSold: wholeNumberField,
    totalSales: currencyField,
    costOfProduct: currencyField,
    laborCost: currencyField,
    travelCost: currencyField,
    age5u: wholeNumberField,
    age6u: wholeNumberField,
    age7u: wholeNumberField,
    age8u: wholeNumberField,
    age9u: wholeNumberField,
    age10u: wholeNumberField,
    age11u: wholeNumberField,
    age12u: wholeNumberField,
    age13u: wholeNumberField,
    age14u: wholeNumberField,
    age15u: wholeNumberField,
    age16u: wholeNumberField,
  })
  .superRefine((value, context) => {
    if (value.shirtsSold > value.totalShirts) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shirtsSold"],
        message: "Shirts sold cannot exceed total shirts.",
      });
    }
  });

export type EventEntryInput = z.infer<typeof eventEntrySchema>;
