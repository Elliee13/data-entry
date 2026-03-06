import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { errorResponse } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { createApprovedUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const payload = await request.json();
    const createdUser = await createApprovedUser(payload, user.id);

    return NextResponse.json({ user: createdUser });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to create user.");
  }
}
