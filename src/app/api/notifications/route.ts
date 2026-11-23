import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAnyRole } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { listUserNotifications, markNotificationsRead } from "@/lib/services/notification-service";

const markReadSchema = z.object({
  ids: z.array(z.string().trim().min(1)).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAnyRole(user, ["IMPORT", "MER", "GD", "GM", "VP", "EVP", "VENDOR", "FORWARDER", "ADMIN"]);
    const data = await listUserNotifications(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    assertAnyRole(user, ["IMPORT", "MER", "GD", "GM", "VP", "EVP", "VENDOR", "FORWARDER", "ADMIN"]);
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = markReadSchema.parse(body);
    await markNotificationsRead(user.id, parsed.ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
