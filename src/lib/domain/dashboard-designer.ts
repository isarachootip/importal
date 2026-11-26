import { DESIGNER_NAMES, PATTERNS, REASONS, ROLE_TH, STEP_SUBS, SUB_MAP, type PatternDef, type SubStatus } from "./aw-constants";
import type { JobRecord } from "./job-types";
import { awDeltaDays, awDueDays, awSla, curStatus, curSub, dateOfMark, hasLicense, isOpenJob, isOverdue, licenseDays, ownerLabel, roundsCount, totalSla } from "./sla-engine";
import { addWorkingDays, diffWorkingDays } from "./working-days";

const DS_SUBS: SubStatus[] = ["Info Checking", "Drafting", "Revising", "Present AW", "EVP Revising", "Final AW"];
const WAIT_SUBS: SubStatus[] = ["Info Incomplete", "Photo Shoot", "Import Review", "MDSG Review", "EVP Review"];

export interface DesignerFilter {
  sdept?: string;
  designer?: string;
  importer?: string;
  brand?: string;
}

export interface UnsubmittedAwRow {
  job: JobRecord;
  sub: SubStatus;
  status: string;
  rounds: number;
  owner: string;
  awDueIso: string;
  awDelta: number;
  grDueIso: string;
  grDelta: number;
  licAdd: number;
}

export interface DesignerDashboardData {
  awDoneCount: number;
  awOnTimeCount: number;
  avgRounds: string;
  licenseIncludedCount: number;
  workloadRows: Array<{ n: string; all: number; mine: number; od: number; wait: number; done: number; by: Array<[SubStatus, number]>; wby: Array<[SubStatus, number]> }>;
  photoAll: number;
  photoNow: number;
  photoOverdue: number;
  patternRows: Array<{ p: PatternDef; n: number; on: number; avg: number | null }>;
  personRows: Array<{ n: string; c: number; on: number; r: string }>;
  stepDelayRows: Array<{ s: SubStatus; rolesLabel: string; avg: number; sla: number }>;
  stepDelayMax: number;
  reasonRows: Array<[string, number]>;
  reasonMax: number;
  unsubmittedFinalAw: UnsubmittedAwRow[];
}

export function computeDesignerDashboard(
  jobs: JobRecord[],
  today: string,
  holidays: ReadonlySet<string>,
  filter: DesignerFilter = {}
): DesignerDashboardData {
  const F2 = jobs.filter(
    (j) =>
      (!filter.sdept || j.sdepts.some((x) => String(x) === String(filter.sdept))) &&
      (!filter.designer || j.designer === filter.designer) &&
      (!filter.importer || j.importer === filter.importer) &&
      (!filter.brand || j.brand === filter.brand)
  );

  const awd = F2.filter((j) => Boolean(dateOfMark(j, "final") && dateOfMark(j, "info")));
  const awOn = awd.filter((j) => diffWorkingDays(dateOfMark(j, "info"), dateOfMark(j, "final"), holidays) <= awSla(j));

  const workloadRows = DESIGNER_NAMES.filter((n) => !filter.designer || n === filter.designer).map((n) => {
    const L = F2.filter((j) => j.designer === n);
    const mine = L.filter((j) => DS_SUBS.includes(curSub(j)));
    const wait = L.filter((j) => WAIT_SUBS.includes(curSub(j)));
    const done = L.filter((j) => Boolean(dateOfMark(j, "final")));
    return {
      n, all: L.length, mine: mine.length, od: mine.filter((j) => isOverdue(j, today, holidays)).length,
      wait: wait.length, done: done.length,
      by: DS_SUBS.map((s): [SubStatus, number] => [s, mine.filter((j) => curSub(j) === s).length]).filter((x) => x[1] > 0),
      wby: WAIT_SUBS.map((s): [SubStatus, number] => [s, wait.filter((j) => curSub(j) === s).length]).filter((x) => x[1] > 0),
    };
  });

  const photoAll = F2.filter((j) => j.photo);
  const photoNow = F2.filter((j) => curSub(j) === "Photo Shoot");

  const patternRows = PATTERNS.map((p) => {
    const L = awd.filter((j) => j.pattern === p.id);
    const on = L.filter((j) => diffWorkingDays(dateOfMark(j, "info"), dateOfMark(j, "final"), holidays) <= awSla(j));
    const act = L.map((j) => diffWorkingDays(dateOfMark(j, "info"), dateOfMark(j, "final"), holidays));
    return { p, n: L.length, on: on.length, avg: act.length ? Math.round(act.reduce((a, b) => a + b, 0) / act.length) : null };
  });

  const personRows = DESIGNER_NAMES.map((n) => {
    const L = awd.filter((j) => j.designer === n);
    const on = L.filter((j) => diffWorkingDays(dateOfMark(j, "info"), dateOfMark(j, "final"), holidays) <= awSla(j));
    const rd = L.map(roundsCount);
    return { n, c: L.length, on: on.length, r: rd.length ? (rd.reduce((a, b) => a + b, 0) / rd.length).toFixed(1) : "–" };
  }).filter((x) => x.c > 0);

  const seg: Partial<Record<SubStatus, number[]>> = {};
  F2.forEach((j) => {
    j.history.forEach((e, idx) => {
      const next = j.history[idx + 1];
      if (next && STEP_SUBS.includes(e.sub)) {
        const arr = seg[e.sub] ?? [];
        arr.push(diffWorkingDays(e.d, next.d, holidays));
        seg[e.sub] = arr;
      }
    });
  });

  const stepDelayRows = STEP_SUBS.filter((s) => Boolean(seg[s])).map((s) => {
    const arr = seg[s]!;
    const avg = arr.reduce((x, y) => x + y, 0) / arr.length;
    return { s, rolesLabel: SUB_MAP[s].roles.map((r) => ROLE_TH[r] ?? r).join(" / "), avg: Number(avg.toFixed(1)), sla: SUB_MAP[s].sla ?? 1 };
  });

  const reasonCounts: Record<string, number> = {};
  F2.forEach((j) => {
    j.history.filter((h) => h.mark === "fail").forEach((h) => {
      const matched = REASONS.find((r) => h.note.includes(r)) ?? "อื่นๆ";
      reasonCounts[matched] = (reasonCounts[matched] ?? 0) + 1;
    });
  });
  const reasonRows = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

  const unsubmittedFinalAw = F2.filter((j) => isOpenJob(j) && !dateOfMark(j, "final"))
    .sort((a, b) => awDeltaDays(b, today, holidays) - awDeltaDays(a, today, holidays) || a.piDate.localeCompare(b.piDate))
    .map((j) => {
      const awDueIso = addWorkingDays(j.piDate, awDueDays(j), holidays);
      const grDueIso = addWorkingDays(j.piDate, totalSla(j), holidays);
      return {
        job: j, sub: curSub(j), status: curStatus(j), rounds: roundsCount(j), owner: ownerLabel(j),
        awDueIso, awDelta: diffWorkingDays(awDueIso, today, holidays),
        grDueIso, grDelta: diffWorkingDays(grDueIso, today, holidays),
        licAdd: hasLicense(j) ? licenseDays(j.license) : 0,
      };
    });

  return {
    awDoneCount: awd.length, awOnTimeCount: awOn.length,
    avgRounds: awd.length ? (awd.reduce((a, j) => a + roundsCount(j), 0) / awd.length).toFixed(1) : "–",
    licenseIncludedCount: F2.filter((j) => Boolean(dateOfMark(j, "final")) && hasLicense(j)).length,
    workloadRows, photoAll: photoAll.length, photoNow: photoNow.length,
    photoOverdue: photoNow.filter((j) => isOverdue(j, today, holidays)).length,
    patternRows, personRows, stepDelayRows,
    stepDelayMax: Math.max(10, ...stepDelayRows.map((x) => Math.max(x.avg, x.sla))),
    reasonRows, reasonMax: Math.max(1, ...reasonRows.map((x) => x[1])),
    unsubmittedFinalAw,
  };
}
