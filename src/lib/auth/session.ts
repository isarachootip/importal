import { cookies } from "next/headers";
import { ROLES_META } from "@/lib/domain/aw-constants";
import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";
import { findStaffByDisplayName } from "@/lib/domain/mdsg-resolver";
import type { TrackerSession } from "./types";

export const ROLE_COOKIE = "aw_tracker_role";
export const USER_COOKIE = "aw_tracker_user";

const VALID_ROLES = new Set<TrackerRoleKey>(["import", "mdsg", "evp", "designer", "photographer", "mgmt"]);

export async function getTrackerSession(): Promise<TrackerSession> {
  const store = await cookies();
  const rawRole = store.get(ROLE_COOKIE)?.value as TrackerRoleKey | undefined;
  const role: TrackerRoleKey = rawRole && VALID_ROLES.has(rawRole) ? rawRole : "import";
  const meta = ROLES_META[role];

  const rawUser = store.get(USER_COOKIE)?.value;
  const matched = rawUser ? findStaffByDisplayName(rawUser) : undefined;
  const activeStaff = matched && matched.role === role ? matched : findStaffByDisplayName(meta.defaultUser);

  return {
    role,
    roleName: meta.name,
    initials: meta.ini,
    userDisplayName: activeStaff?.displayName ?? meta.defaultUser,
    userEmail: activeStaff?.email ?? "no-reply@chg.co.th",
  };
}
