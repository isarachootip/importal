import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";

export interface TrackerSession {
  role: TrackerRoleKey;
  roleName: string;
  initials: string;
  userDisplayName: string;
  userEmail: string;
}
