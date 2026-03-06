import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { errorResponse } from "@/lib/http";
import { retryWeeklyReport } from "@/lib/reports";
import { getCurrentUser } from "@/lib/session";

type RetryRouteProps = {
  params: Promise<{ reportId: string }>;
};

export async function POST(_: NextRequest, { params }: RetryRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const { reportId } = await params;
    const result = await retryWeeklyReport(reportId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to retry weekly report.");
  }
}
