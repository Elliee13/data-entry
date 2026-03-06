import { NextRequest, NextResponse } from "next/server";
import { createEventEntry } from "@/lib/entries";
import { errorResponse } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const payload = await request.json();
    const entry = await createEventEntry(payload, user.id);

    return NextResponse.json({ entry });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to create entry.");
  }
}
