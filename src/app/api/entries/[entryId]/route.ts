import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { deleteEventEntry, updateEventEntry } from "@/lib/entries";
import { errorResponse } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

type EntryRouteProps = {
  params: Promise<{ entryId: string }>;
};

export async function PATCH(request: NextRequest, { params }: EntryRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const payload = await request.json();
    const { entryId } = await params;
    const entry = await updateEventEntry(entryId, payload, user.id);

    return NextResponse.json({ entry });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to update entry.");
  }
}

export async function DELETE(_: NextRequest, { params }: EntryRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const { entryId } = await params;
    await deleteEventEntry(entryId, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to delete entry.");
  }
}
