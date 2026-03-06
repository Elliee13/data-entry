import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { errorResponse } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { updateApprovedUser } from "@/lib/users";

type UserRouteProps = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: NextRequest, { params }: UserRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return errorResponse("Administrator access required.", 403);
  }

  try {
    const payload = await request.json();
    const { userId } = await params;
    const updatedUser = await updateApprovedUser(userId, payload, user.id);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unable to update user.");
  }
}
