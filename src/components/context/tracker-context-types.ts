import type React from "react";
import type { TrackerSession } from "@/lib/auth/types";
import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";
import type { DraftData, JobRecord, OutboxMail } from "@/lib/domain/job-types";
import type { NotifMode } from "@/lib/domain/rules-metadata";

export interface StaffClientEntry {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  nickname: string;
  jobTitle: string;
  role: string;
  orgLevel: string;
  sdeptCodes: number[];
}

export interface GlobalFilterState {
  year: string;
  month: string;
  sdept: string;
  importer: string;
  designer: string;
  brand: string;
}

export interface TasksFilterState {
  importer: string;
  designer: string;
  sdept: string;
}

export interface Dash2FilterState {
  sdept: string;
  designer: string;
  importer: string;
  brand: string;
}

export interface BootstrapPayload {
  today: string;
  session: TrackerSession;
  jobs: JobRecord[];
  holidays: string[];
  drafts: Record<string, DraftData>;
  reviews: Record<string, { st: string; note: string }>;
  notifModes: Record<string, NotifMode>;
  outbox: OutboxMail[];
  staff: StaffClientEntry[];
}

export interface MailModalState {
  title: string;
  mail?: OutboxMail;
  digestRole?: TrackerRoleKey;
}

export interface TrackerContextValue extends BootstrapPayload {
  holidaySet: ReadonlySet<string>;
  filter: GlobalFilterState;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  resetFilter: () => void;
  jobsTab: string;
  setJobsTab: (tab: string) => void;
  jobsQuery: string;
  setJobsQuery: (q: string) => void;
  tasksFilter: TasksFilterState;
  setTasksFilter: React.Dispatch<React.SetStateAction<TasksFilterState>>;
  dash2Filter: Dash2FilterState;
  setDash2Filter: React.Dispatch<React.SetStateAction<Dash2FilterState>>;
  showMailPopOnSend: boolean;
  setShowMailPopOnSend: (v: boolean) => void;
  mailPop: OutboxMail | null;
  setMailPop: (m: OutboxMail | null) => void;
  mailModal: MailModalState | null;
  setMailModal: (m: MailModalState | null) => void;
  cancelJobId: string | null;
  setCancelJobId: (id: string | null) => void;
  toast: string;
  showToast: (msg: string) => void;
  switchSession: (role: TrackerRoleKey, userDisplayName?: string) => Promise<void>;
  upsertJobState: (job: JobRecord, mail?: OutboxMail | null) => void;
  saveDraftRemote: (key: string, values: Record<string, string | boolean>, fileNames?: string[]) => Promise<void>;
  deleteDraftRemote: (key: string) => Promise<void>;
  updateHolidaysRemote: (dates: string[], resetDefault?: boolean) => Promise<void>;
  saveReviewRemote: (key: string, st: string, note: string) => Promise<void>;
  updateNotifModeRemote: (eventKey: string, mode: NotifMode) => Promise<void>;
  resetDemoRemote: () => Promise<void>;
}
