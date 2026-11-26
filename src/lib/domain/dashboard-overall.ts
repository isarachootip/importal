import {
  LICENSE_LIST,
  PATTERNS,
  ROLE_TH,
  STATUS_LIST,
  STEP_SUBS,
  SUB_MAP,
  type MainStatus,
  type PatternDef,
  type SubStatus,
} from "./aw-constants";
import type { JobRecord } from "./job-types";
import { curStatus, curSub, dateOfMark, isOverdue, licenseDays, totalSla } from "./sla-engine";
import { addWorkingDays, diffWorkingDays } from "./working-days";

export interface MonthlyRow {
  m: string;
  t: number;
  it: number;
  g: number;
  on: number;
  late: number;
  pOver: number;
  pOk: number;
  cx: number;
}

export interface OverallDashboardData {
  totalPi: number;
  totalItems: number;
  pendingCount: number;
  pendingItems: number;
  prodCount: number;
  prodItems: number;
  grCount: number;
  grItems: number;
  cancelledCount: number;
  cancelledItems: number;
  grOnTimeCount: number;
  monthlyRows: MonthlyRow[];
  monthlyMax: number;
  statusRows: Array<{ s: MainStatus; n: number; it: number }>;
  subBottlenecks: Array<{ s: SubStatus; rolesLabel: string; n: number; o: number }>;
  subMax: number;
  overallPatternRows: Array<{ p: PatternDef; n: number; on: number; avg: number | null; dl: number | null }>;
  licenseRows: Array<{ l: string; add: number; n: number; on: number; avg: number | null; sla: number | null }>;
}

function sumItems(list: JobRecord[]): number {
  return list.reduce((a, j) => a + j.items, 0);
}

export function computeOverallDashboard(
  jobs: JobRecord[],
  today: string,
  holidays: ReadonlySet<string>
): OverallDashboardData {
  const gr = jobs.filter((j) => curSub(j) === "Goods Received");
  const grOn = gr.filter((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays) <= totalSla(j));
  const pending = jobs.filter((j) => ["Open", "Draft AW", "Final AW"].includes(curStatus(j)));
  const prod = jobs.filter((j) => curStatus(j) === "Production");
  const cancelled = jobs.filter((j) => curSub(j) === "Cancelled");

  const statusRows = STATUS_LIST.map((s) => {
    const L = jobs.filter((j) => curStatus(j) === s);
    return { s, n: L.length, it: sumItems(L) };
  });

  const allPendingSubs: SubStatus[] = [...STEP_SUBS, "In Production"];
  const subBottlenecks = allPendingSubs
    .map((s) => ({
      s,
      rolesLabel: SUB_MAP[s].roles.map((r) => ROLE_TH[r] ?? r).join(" / "),
      n: jobs.filter((j) => curSub(j) === s).length,
      o: jobs.filter((j) => curSub(j) === s && isOverdue(j, today, holidays)).length,
    }))
    .filter((x) => x.n > 0);

  const months = [...new Set(jobs.map((j) => j.piDate.slice(0, 7)))].sort();
  const monthlyRows: MonthlyRow[] = months.map((m) => {
    const active = jobs.filter((j) => j.piDate.slice(0, 7) === m && curSub(j) !== "Cancelled");
    const g = active.filter((j) => curSub(j) === "Goods Received");
    const on = g.filter((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays) <= totalSla(j)).length;
    const pd = active.filter((j) => curSub(j) !== "Goods Received");
    const pOver = pd.filter((j) => today > addWorkingDays(j.piDate, totalSla(j), holidays)).length;
    const cx = jobs.filter((j) => j.piDate.slice(0, 7) === m && curSub(j) === "Cancelled").length;
    return { m, t: active.length, it: sumItems(active), g: g.length, on, late: g.length - on, pOver, pOk: pd.length - pOver, cx };
  });

  const overallPatternRows = PATTERNS.map((p) => {
    const L = gr.filter((j) => j.pattern === p.id);
    const on = L.filter((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays) <= totalSla(j));
    const act = L.map((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays));
    const dl = L
      .filter((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays) > totalSla(j))
      .map((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays) - totalSla(j));
    return {
      p,
      n: L.length,
      on: on.length,
      avg: act.length ? Math.round(act.reduce((a, b) => a + b, 0) / act.length) : null,
      dl: dl.length ? Math.round(dl.reduce((a, b) => a + b, 0) / dl.length) : null,
    };
  });

  const licenseRows = LICENSE_LIST.map((l) => {
    const L = gr.filter((j) => j.license === l);
    const on = L.filter((j) => diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays) <= totalSla(j));
    const avg = L.length
      ? Math.round(L.reduce((a, j) => a + diffWorkingDays(j.piDate, dateOfMark(j, "gr"), holidays), 0) / L.length)
      : null;
    const sla = L.length ? Math.round(L.reduce((a, j) => a + totalSla(j), 0) / L.length) : null;
    return { l, add: licenseDays(l), n: L.length, on: on.length, avg, sla };
  });

  return {
    totalPi: jobs.length,
    totalItems: sumItems(jobs),
    pendingCount: pending.length,
    pendingItems: sumItems(pending),
    prodCount: prod.length,
    prodItems: sumItems(prod),
    grCount: gr.length,
    grItems: sumItems(gr),
    cancelledCount: cancelled.length,
    cancelledItems: sumItems(cancelled),
    grOnTimeCount: grOn.length,
    monthlyRows,
    monthlyMax: Math.max(1, ...monthlyRows.map((x) => x.t)),
    statusRows,
    subBottlenecks,
    subMax: Math.max(1, ...subBottlenecks.map((x) => x.n)),
    overallPatternRows,
    licenseRows,
  };
}
