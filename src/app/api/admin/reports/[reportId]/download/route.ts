import { NextRequest } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { errorResponse } from "@/lib/http";
import { getWeeklyReportDownload } from "@/lib/reports";
import { getCurrentUser } from "@/lib/session";

type DownloadRouteProps = {
  params: Promise<{ reportId: string }>;
};

export async function GET(request: NextRequest, { params }: DownloadRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  const format = request.nextUrl.searchParams.get("format");

  if (format !== "csv" && format !== "xlsx") {
    return errorResponse("Invalid download format.", 400);
  }

  try {
    const { reportId } = await params;
    const download = await getWeeklyReportDownload(reportId, format);

    return new Response(download.body, {
      headers: {
        "Content-Type": download.contentType,
        "Content-Disposition": `attachment; filename="${download.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to download report.", 400);
  }
}
