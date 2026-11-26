import {
  PATTERNS,
  ROLE_TH,
  SUB_MAP,
  type MainStatus,
  type PatternDef,
  type SubStatus,
} from "./aw-constants";
import type { HistoryEntry, HistoryMark, JobRecord } from "./job-types";
import { addWorkingDays, diffWorkingDays } from "./working-days";

export function curEntry(j: JobRecord): HistoryEntry {
  return j.history[j.history.length - 1] ?? {
    sub: "Info Checking",
    d: j.piDate,
    by: "import",
    act: "Create Job",
    note: "",
    mark: "create",
  };
}

export function curSub(j: JobRecord): SubStatus {
  return curEntry(j).sub;
}

export function curStatus(j: JobRecord): MainStatus {
  return SUB_MAP[curSub(j)].st;
}

export function jobPattern(j: JobRecord): PatternDef {
  return PATTERNS.find((p) => p.id === j.pattern) ?? PATTERNS[0]!;
}

export function stageStart(j: JobRecord): string {
  const h = j.history;
  const n = h.length;
  if (n > 1 && h[n - 1]!.sub === "MDSG Review" && h[n - 2]!.sub === "Import Review") {
    return h[n - 2]!.d;
  }
  return curEntry(j).d;
}

export function dayInStage(j: JobRecord, today: string, holidays: ReadonlySet<string>): number {
  return diffWorkingDays(stageStart(j), today, holidays);
}

export function slaOf(j: JobRecord, sub?: SubStatus): number | null {
  const target = sub ?? curSub(j);
  if (target === "In Production") return (j.leadtime ?? 55) + 20;
  return SUB_MAP[target].sla;
}

export function isOpenJob(j: JobRecord): boolean {
  const s = curSub(j);
  return s !== "Goods Received" && s !== "Cancelled";
}

export function isOverdue(j: JobRecord, today: string, holidays: ReadonlySet<string>): boolean {
  const s = slaOf(j);
  return isOpenJob(j) && s != null && dayInStage(j, today, holidays) > s;
}

export function licenseDays(lic: string): number {
  if (lic === "TISI (มอก.)") return 90;
  if (lic === "อย.") return 60;
  return 0;
}

export function extraItemDays(items: number): number {
  return Math.max(0, Math.ceil(items / 30) - 1) * 7;
}

export function slaAdjustment(j: JobRecord): number {
  return extraItemDays(j.items) + (j.photo ? 7 : 0) + licenseDays(j.license);
}

export function totalSla(j: JobRecord): number {
  return jobPattern(j).total + slaAdjustment(j);
}

export function hasLicense(j: JobRecord): boolean {
  return j.license !== "ไม่มี";
}

export function dateOfMark(j: JobRecord, mark: HistoryMark): string | null {
  return j.history.find((h) => h.mark === mark)?.d ?? null;
}

export function awSla(j: JobRecord): number {
  return Math.max(jobPattern(j).aw, 1);
}

export function ownerLabel(j: JobRecord): string {
  const roles = SUB_MAP[curSub(j)].roles;
  return roles.length > 0 ? roles.map((x) => ROLE_TH[x] ?? x).join(" / ") : "–";
}

export function importReviewResult(j: JobRecord): { pass: boolean; note: string; d: string | null } {
  const entry = [...j.history].reverse().find((h) => h.sub === "MDSG Review");
  if (!entry) return { pass: true, note: "", d: null };
  return { pass: /Import: Pass/.test(entry.act), note: entry.note, d: entry.d };
}

export function roundsCount(j: JobRecord): number {
  return j.history.filter((h) => h.mark === "fail").length;
}

export function awDueDays(j: JobRecord): number {
  const p = jobPattern(j);
  return p.info + p.brief + (j.photo ? 7 : 0) + p.aw + extraItemDays(j.items);
}

export function awDeltaDays(j: JobRecord, today: string, holidays: ReadonlySet<string>): number {
  return diffWorkingDays(addWorkingDays(j.piDate, awDueDays(j), holidays), today, holidays);
}

export function briefLabelTh(v: string | undefined): string {
  if (v === "Y") return "Y · นัดประชุม Brief";
  if (v === "N") return "N · ไม่ต้อง Brief";
  return "–";
}

export function lastNoteEntry(j: JobRecord): HistoryEntry | null {
  for (let i = j.history.length - 1; i >= 0; i--) {
    if (j.history[i]?.note) return j.history[i]!;
  }
  return null;
}
