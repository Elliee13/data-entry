import { NextRequest, NextResponse } from "next/server";
import { UserRole, ReportTriggerType } from "@/generated/prisma/enums";
import { errorResponse } from "@/lib/http";
import { generateWeeklyReport } from "@/lib/reports";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as { weekKey?: string };
    const result = await generateWeeklyReport({
      actorUserId: user.id,
      triggerType: ReportTriggerType.MANUAL,
      targetWeekKey: payload.weekKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to generate weekly report.");
  }
}
