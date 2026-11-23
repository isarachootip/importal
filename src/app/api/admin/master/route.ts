import { NextResponse } from "next/server";
import { assertAnyRole } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { applyAdminMasterMutation, getAdminMasterData } from "@/lib/services/admin-service";
import { handleApiError } from "@/lib/services/api-helpers";
import { adminMasterMutationSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAnyRole(user, ["ADMIN"]);
    const data = await getAdminMasterData();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body: unknown = await request.json();
    const parsed = adminMasterMutationSchema.parse(body);
    const result = await applyAdminMasterMutation(parsed, user);
    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
