import { NextRequest, NextResponse } from "next/server";
import { ReportTriggerType } from "@/generated/prisma/enums";
import { getCronEnv } from "@/lib/env";
import { errorResponse } from "@/lib/http";
import { generateWeeklyReport } from "@/lib/reports";
import { isCronDue } from "@/lib/time";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${getCronEnv().CRON_SECRET}`) {
    return errorResponse("Unauthorized cron request.", 401);
  }

  if (!isCronDue()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Cron not due in business timezone." });
  }

  try {
    const result = await generateWeeklyReport({
      triggerType: ReportTriggerType.CRON,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to run weekly cron job.", 500);
  }
}
