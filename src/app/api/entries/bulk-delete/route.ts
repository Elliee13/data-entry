import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";
import { deleteEventEntry } from "@/lib/entries";
import { errorResponse } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

const bulkDeleteSchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1, "Select at least one entry."),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const payload = bulkDeleteSchema.parse(await request.json());
    let deletedCount = 0;
    let skippedCount = 0;

    for (const entryId of payload.entryIds) {
      try {
        await deleteEventEntry(entryId, user.id);
        deletedCount += 1;
      } catch (error) {
        if (error instanceof Error && error.message === "Entry not found.") {
          skippedCount += 1;
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json({ ok: true, deletedCount, skippedCount });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to delete selected entries.");
  }
}
