import { z } from "zod";
import { REPORT_RECIPIENT } from "@/lib/constants";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
});

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters.").optional(),
  NEXTAUTH_URL: z.string().url().optional(),
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required."),
});

const reportingEnvSchema = z.object({
  EMAIL_MODE: z.enum(["disabled", "resend"]).default("disabled"),
  REPORT_TO_EMAIL: z.string().email("REPORT_TO_EMAIL must be a valid email.").optional(),
  REPORT_FROM_EMAIL: z.string().email("REPORT_FROM_EMAIL must be a valid email.").optional(),
});

const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required."),
  REPORT_FROM_EMAIL: z.string().email("REPORT_FROM_EMAIL must be a valid email."),
});

type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
type AuthEnv = { AUTH_SECRET: string; NEXTAUTH_URL?: string };
type CronEnv = z.infer<typeof cronEnvSchema>;
type ReportSettings = {
  emailMode: "disabled" | "resend";
  reportToEmail: string;
  reportFromEmail: string;
};
type ResendEnv = z.infer<typeof resendEnvSchema>;

let cachedDatabaseEnv: DatabaseEnv | null = null;
let cachedAuthEnv: AuthEnv | null = null;
let cachedCronEnv: CronEnv | null = null;
let cachedReportSettings: ReportSettings | null = null;
let cachedResendEnv: ResendEnv | null = null;

export function getDatabaseEnv() {
  if (cachedDatabaseEnv) {
    return cachedDatabaseEnv;
  }

  cachedDatabaseEnv = databaseEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  return cachedDatabaseEnv;
}

export function getAuthEnv() {
  if (cachedAuthEnv) {
    return cachedAuthEnv;
  }

  const parsed = authEnvSchema.parse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  });

  if (parsed.AUTH_SECRET) {
    cachedAuthEnv = parsed as AuthEnv;
    return cachedAuthEnv;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  cachedAuthEnv = {
    AUTH_SECRET: "development-auth-secret-change-me-1234567890",
    NEXTAUTH_URL: parsed.NEXTAUTH_URL,
  };

  return cachedAuthEnv;
}

export function getCronEnv() {
  if (cachedCronEnv) {
    return cachedCronEnv;
  }

  cachedCronEnv = cronEnvSchema.parse({
    CRON_SECRET: process.env.CRON_SECRET,
  });

  return cachedCronEnv;
}

export function getReportSettings() {
  if (cachedReportSettings) {
    return cachedReportSettings;
  }

  const parsed = reportingEnvSchema.parse({
    EMAIL_MODE: process.env.EMAIL_MODE,
    REPORT_TO_EMAIL: process.env.REPORT_TO_EMAIL,
    REPORT_FROM_EMAIL: process.env.REPORT_FROM_EMAIL,
  });

  cachedReportSettings = {
    emailMode: parsed.EMAIL_MODE,
    reportToEmail: parsed.REPORT_TO_EMAIL ?? REPORT_RECIPIENT,
    reportFromEmail: parsed.REPORT_FROM_EMAIL ?? "manual-delivery@local.test",
  };

  return cachedReportSettings;
}

export function getResendEnv() {
  if (cachedResendEnv) {
    return cachedResendEnv;
  }

  cachedResendEnv = resendEnvSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    REPORT_FROM_EMAIL: process.env.REPORT_FROM_EMAIL,
  });

  return cachedResendEnv;
}
