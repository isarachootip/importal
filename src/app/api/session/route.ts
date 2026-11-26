import { cookies } from "next/headers";
import { getTrackerSession, ROLE_COOKIE, USER_COOKIE } from "@/lib/auth/session";
import { ROLES_META } from "@/lib/domain/aw-constants";
import { findStaffByDisplayName } from "@/lib/domain/mdsg-resolver";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { SessionSwitchSchema } from "@/lib/validations/aw-schemas";

export async function GET() {
  const session = await getTrackerSession();
  return jsonOk({ session });
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = SessionSwitchSchema.parse(body);
    const store = await cookies();
    const cookieOpts = { path: "/", httpOnly: false, sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30 };

    store.set(ROLE_COOKIE, parsed.role, cookieOpts);
    const chosen = parsed.userDisplayName
      ? findStaffByDisplayName(parsed.userDisplayName)
      : findStaffByDisplayName(ROLES_META[parsed.role].defaultUser);

    const displayName = chosen && chosen.role === parsed.role
      ? chosen.displayName
      : ROLES_META[parsed.role].defaultUser;
    store.set(USER_COOKIE, displayName, cookieOpts);

    const session = await getTrackerSession();
    return jsonOk({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
