export const APP_TITLE = "B&C / FRECKLES EVENTS TRACKER";
export const APP_TIMEZONE = "America/New_York";
export const REPORT_RECIPIENT = "mike@frecklesgraphics.com";
export const CURRENCY_SCALE = 2;
export const BUSINESS_WEEK_STARTS_ON = 1;
export const CRON_PATH = "/api/cron/weekly-report";

export const AGE_DIVISION_FIELDS = [
  "age5u",
  "age6u",
  "age7u",
  "age8u",
  "age9u",
  "age10u",
  "age11u",
  "age12u",
  "age13u",
  "age14u",
  "age15u",
  "age16u",
] as const;

export type AgeDivisionField = (typeof AGE_DIVISION_FIELDS)[number];
