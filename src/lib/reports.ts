import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";
import { Resend } from "resend";
import { type Prisma } from "@/generated/prisma/client";
import { AuditAction, ReportStatus, ReportTriggerType } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit";
import { APP_TITLE } from "@/lib/constants";
import { db } from "@/lib/db";
import { getReportSettings, getResendEnv } from "@/lib/env";
import {
  formatDateForDisplay,
  getBusinessWeekForDate,
  getCurrentBusinessWeek,
  getPreviousBusinessWeek,
  getWeeklyReportEmailSubject,
} from "@/lib/time";

const reportSelect = {
  id: true,
  weekKey: true,
  weekStartsAt: true,
  weekEndsAt: true,
  status: true,
  triggerType: true,
  emailTo: true,
  emailFrom: true,
  emailSubject: true,
  entryCount: true,
  csvFilename: true,
  xlsxFilename: true,
  emailMessageId: true,
  attemptCount: true,
  lastAttemptAt: true,
  sentAt: true,
  archivedAt: true,
  failureMessage: true,
  createdAt: true,
  updatedAt: true,
  triggeredBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.WeeklyReportSelect;

type WeeklyReportRecord = Prisma.WeeklyReportGetPayload<{ select: typeof reportSelect }>;

function serializeReport(report: WeeklyReportRecord) {
  return report;
}

type ReportDownloadFormat = "csv" | "xlsx";

function getReportColumns() {
  return [
    { header: "Event Name", key: "eventName", width: 28 },
    { header: "Location", key: "location", width: 24 },
    { header: "Date", key: "eventDate", width: 14 },
    { header: "Weather", key: "weather", width: 18 },
    { header: "Coordinator", key: "coordinator", width: 22 },
    { header: "Sport", key: "sport", width: 18 },
    { header: "Shirt Color", key: "shirtColor", width: 16 },
    { header: "Total Teams", key: "totalTeams", width: 14 },
    { header: "Total Shirts", key: "totalShirts", width: 14 },
    { header: "Shirts Sold", key: "shirtsSold", width: 14 },
    { header: "Total Sales", key: "totalSales", width: 14 },
    { header: "Cost Of Product", key: "costOfProduct", width: 16 },
    { header: "Labor Cost", key: "laborCost", width: 14 },
    { header: "Travel", key: "travelCost", width: 12 },
    { header: "5u", key: "age5u", width: 8 },
    { header: "6u", key: "age6u", width: 8 },
    { header: "7u", key: "age7u", width: 8 },
    { header: "8u", key: "age8u", width: 8 },
    { header: "9u", key: "age9u", width: 8 },
    { header: "10u", key: "age10u", width: 8 },
    { header: "11u", key: "age11u", width: 8 },
    { header: "12u", key: "age12u", width: 8 },
    { header: "13u", key: "age13u", width: 8 },
    { header: "14u", key: "age14u", width: 8 },
    { header: "15u", key: "age15u", width: 8 },
    { header: "16u", key: "age16u", width: 8 },
    { header: "Created By", key: "createdBy", width: 24 },
  ] as const;
}

async function getReportRows(weekKey: string) {
  const entries = await db.eventEntry.findMany({
    where: {
      weekKey,
      deletedAt: null,
    },
    orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      eventName: true,
      location: true,
      eventDate: true,
      weather: true,
      coordinator: true,
      sport: true,
      shirtColor: true,
      totalTeams: true,
      totalShirts: true,
      shirtsSold: true,
      totalSales: true,
      costOfProduct: true,
      laborCost: true,
      travelCost: true,
      age5u: true,
      age6u: true,
      age7u: true,
      age8u: true,
      age9u: true,
      age10u: true,
      age11u: true,
      age12u: true,
      age13u: true,
      age14u: true,
      age15u: true,
      age16u: true,
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return entries.map((entry) => ({
    eventName: entry.eventName,
    location: entry.location,
    eventDate: entry.eventDate,
    weather: entry.weather,
    coordinator: entry.coordinator,
    sport: entry.sport,
    shirtColor: entry.shirtColor,
    totalTeams: entry.totalTeams,
    totalShirts: entry.totalShirts,
    shirtsSold: entry.shirtsSold,
    totalSales: Number(entry.totalSales),
    costOfProduct: Number(entry.costOfProduct),
    laborCost: Number(entry.laborCost),
    travelCost: Number(entry.travelCost),
    age5u: entry.age5u,
    age6u: entry.age6u,
    age7u: entry.age7u,
    age8u: entry.age8u,
    age9u: entry.age9u,
    age10u: entry.age10u,
    age11u: entry.age11u,
    age12u: entry.age12u,
    age13u: entry.age13u,
    age14u: entry.age14u,
    age15u: entry.age15u,
    age16u: entry.age16u,
    createdBy: entry.createdBy.name,
  }));
}

function buildCsv(rows: Awaited<ReturnType<typeof getReportRows>>) {
  return stringify(rows, {
    header: true,
    columns: getReportColumns().map((column) => ({
      key: column.key,
      header: column.header,
    })),
  });
}

async function buildWorkbook(rows: Awaited<ReturnType<typeof getReportRows>>) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Weekly Report");

  worksheet.columns = [...getReportColumns()];
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) {
    worksheet.addRow(row);
  }

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFF8FAFC" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF12304A" },
  };

  for (const columnKey of ["K", "L", "M", "N"]) {
    worksheet.getColumn(columnKey).numFmt = "$#,##0.00";
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildWeeklyReportArtifacts(weekKey: string) {
  const week = getBusinessWeekForDate(weekKey);
  const rows = await getReportRows(week.weekKey);

  return {
    weekKey: week.weekKey,
    entryCount: rows.length,
    csvFilename: `freckles-events-${week.weekKey}.csv`,
    xlsxFilename: `freckles-events-${week.weekKey}.xlsx`,
    emailSubject: getWeeklyReportEmailSubject(week),
    csvContent: buildCsv(rows),
    xlsxContent: await buildWorkbook(rows),
  };
}

async function sendReportEmail({
  subject,
  csvFilename,
  csvContent,
  xlsxFilename,
  xlsxContent,
}: {
  subject: string;
  csvFilename: string;
  csvContent: string;
  xlsxFilename: string;
  xlsxContent: Buffer;
}) {
  const reportSettings = getReportSettings();
  const resendEnv = getResendEnv();
  const resend = new Resend(resendEnv.RESEND_API_KEY);

  return resend.emails.send({
    from: resendEnv.REPORT_FROM_EMAIL,
    to: reportSettings.reportToEmail,
    subject,
    html: `<p>${APP_TITLE} weekly report attached.</p>`,
    text: `${APP_TITLE} weekly report attached.`,
    attachments: [
      {
        filename: csvFilename,
        content: Buffer.from(csvContent, "utf8"),
      },
      {
        filename: xlsxFilename,
        content: xlsxContent,
      },
    ],
  });
}

function assertClosedWeek(weekKey: string) {
  const currentWeek = getCurrentBusinessWeek();

  if (weekKey === currentWeek.weekKey) {
    throw new Error("The current week cannot be reported until the business week closes.");
  }
}

export async function listWeeklyReports() {
  const reports = await db.weeklyReport.findMany({
    select: reportSelect,
    orderBy: [{ weekStartsAt: "desc" }, { createdAt: "desc" }],
  });

  return reports.map(serializeReport);
}

export async function generateWeeklyReport({
  actorUserId,
  triggerType,
  targetWeekKey,
}: {
  actorUserId?: string;
  triggerType: ReportTriggerType;
  targetWeekKey?: string;
}) {
  const targetWeek = targetWeekKey ? getBusinessWeekForDate(targetWeekKey) : getPreviousBusinessWeek();

  assertClosedWeek(targetWeek.weekKey);

  const existing = await db.weeklyReport.findUnique({
    where: { weekKey: targetWeek.weekKey },
    select: reportSelect,
  });

  if (existing?.status === ReportStatus.SENT || existing?.status === ReportStatus.GENERATED) {
    return {
      ok: true,
      skipped: true,
      report: serializeReport(existing),
    };
  }

  const reportSettings = getReportSettings();
  const artifacts = await buildWeeklyReportArtifacts(targetWeek.weekKey);
  const now = new Date();

  const report = existing
    ? await db.weeklyReport.update({
        where: { id: existing.id },
        data: {
          status: ReportStatus.PENDING,
          triggerType,
          triggeredById: actorUserId,
          entryCount: artifacts.entryCount,
          csvFilename: artifacts.csvFilename,
          xlsxFilename: artifacts.xlsxFilename,
          emailSubject: artifacts.emailSubject,
          emailFrom: reportSettings.reportFromEmail,
          emailTo: reportSettings.reportToEmail,
          attemptCount: { increment: 1 },
          lastAttemptAt: now,
          failureMessage: null,
        },
        select: reportSelect,
      })
    : await db.weeklyReport.create({
        data: {
          weekKey: targetWeek.weekKey,
          weekStartsAt: targetWeek.weekStartsAt,
          weekEndsAt: targetWeek.weekEndsAt,
          status: ReportStatus.PENDING,
          triggerType,
          triggeredById: actorUserId,
          emailFrom: reportSettings.reportFromEmail,
          emailTo: reportSettings.reportToEmail,
          emailSubject: artifacts.emailSubject,
          entryCount: artifacts.entryCount,
          csvFilename: artifacts.csvFilename,
          xlsxFilename: artifacts.xlsxFilename,
          attemptCount: 1,
          lastAttemptAt: now,
        },
        select: reportSelect,
      });

  await createAuditLog({
    action: AuditAction.REPORT_GENERATION_STARTED,
    entityType: "weekly_report",
    entityId: report.id,
    actorUserId,
    metadata: {
      weekKey: report.weekKey,
      triggerType,
      entryCount: artifacts.entryCount,
      emailMode: reportSettings.emailMode,
    },
  });

  if (reportSettings.emailMode === "disabled") {
    const generatedReport = await db.$transaction(async (transaction) => {
      const updatedReport = await transaction.weeklyReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.GENERATED,
          archivedAt: new Date(),
          failureMessage: "Email delivery disabled. Download the report files and send them manually.",
        },
        select: reportSelect,
      });

      await transaction.eventEntry.updateMany({
        where: {
          weekKey: targetWeek.weekKey,
          deletedAt: null,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          archivedByReportId: updatedReport.id,
        },
      });

      return updatedReport;
    });

    await createAuditLog({
      action: AuditAction.REPORT_GENERATION_SUCCEEDED,
      entityType: "weekly_report",
      entityId: generatedReport.id,
      actorUserId,
      metadata: {
        weekKey: generatedReport.weekKey,
        mode: "disabled",
        archivedAt: generatedReport.archivedAt?.toISOString(),
      },
    });

    await createAuditLog({
      action: AuditAction.WEEK_ARCHIVED,
      entityType: "weekly_report",
      entityId: generatedReport.id,
      actorUserId,
      metadata: {
        weekKey: generatedReport.weekKey,
        archivedAt: generatedReport.archivedAt?.toISOString(),
      },
    });

    return {
      ok: true,
      skipped: false,
      report: serializeReport(generatedReport),
    };
  }

  const emailResult = await sendReportEmail({
    subject: artifacts.emailSubject,
    csvFilename: artifacts.csvFilename,
    csvContent: artifacts.csvContent,
    xlsxFilename: artifacts.xlsxFilename,
    xlsxContent: artifacts.xlsxContent,
  });

  if (emailResult.error || !emailResult.data) {
    const failedReport = await db.weeklyReport.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.FAILED,
        failureMessage: emailResult.error?.message ?? "Unknown email delivery failure.",
      },
      select: reportSelect,
    });

    await createAuditLog({
      action: AuditAction.REPORT_GENERATION_FAILED,
      entityType: "weekly_report",
      entityId: failedReport.id,
      actorUserId,
      metadata: {
        weekKey: failedReport.weekKey,
        message: failedReport.failureMessage,
      },
    });

    return {
      ok: false,
      skipped: false,
      report: serializeReport(failedReport),
    };
  }

  const sentReport = await db.$transaction(async (transaction) => {
    const updatedReport = await transaction.weeklyReport.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.SENT,
        sentAt: new Date(),
        archivedAt: new Date(),
        emailMessageId: emailResult.data?.id,
        failureMessage: null,
      },
      select: reportSelect,
    });

    await transaction.eventEntry.updateMany({
      where: {
        weekKey: targetWeek.weekKey,
        deletedAt: null,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedByReportId: updatedReport.id,
      },
    });

    return updatedReport;
  });

  await createAuditLog({
    action: AuditAction.REPORT_GENERATION_SUCCEEDED,
    entityType: "weekly_report",
    entityId: sentReport.id,
    actorUserId,
    metadata: {
      weekKey: sentReport.weekKey,
      emailMessageId: sentReport.emailMessageId,
      sentAt: sentReport.sentAt?.toISOString(),
    },
  });

  await createAuditLog({
    action: AuditAction.WEEK_ARCHIVED,
    entityType: "weekly_report",
    entityId: sentReport.id,
    actorUserId,
    metadata: {
      weekKey: sentReport.weekKey,
      archivedAt: sentReport.archivedAt?.toISOString(),
    },
  });

  return {
    ok: true,
    skipped: false,
    report: serializeReport(sentReport),
  };
}

export async function retryWeeklyReport(reportId: string, actorUserId: string) {
  const report = await db.weeklyReport.findUnique({
    where: { id: reportId },
    select: reportSelect,
  });

  if (!report) {
    throw new Error("Weekly report not found.");
  }

  await createAuditLog({
    action: AuditAction.REPORT_RETRY_REQUESTED,
    entityType: "weekly_report",
    entityId: reportId,
    actorUserId,
    metadata: {
      weekKey: report.weekKey,
      status: report.status,
    },
  });

  return generateWeeklyReport({
    actorUserId,
    triggerType: ReportTriggerType.RETRY,
    targetWeekKey: report.weekKey,
  });
}

export async function getWeeklyReportDownload(reportId: string, format: ReportDownloadFormat) {
  const report = await db.weeklyReport.findUnique({
    where: { id: reportId },
    select: reportSelect,
  });

  if (!report) {
    throw new Error("Weekly report not found.");
  }

  const artifacts = await buildWeeklyReportArtifacts(report.weekKey);

  if (format === "csv") {
    return {
      filename: artifacts.csvFilename,
      contentType: "text/csv; charset=utf-8",
      body: Buffer.from(artifacts.csvContent, "utf8"),
    };
  }

  return {
    filename: artifacts.xlsxFilename,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: artifacts.xlsxContent,
  };
}

export function describeWeek(weekKey: string) {
  const week = getBusinessWeekForDate(weekKey);
  return `${formatDateForDisplay(week.weekKey)} - ${formatDateForDisplay(
    week.weekEndsAt,
  )}`;
}
