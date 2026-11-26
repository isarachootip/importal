import { SUB_MAP, type SubStatus } from "./aw-constants";
import type { JobRecord } from "./job-types";
import { dateOfMark, extraItemDays, jobPattern, licenseDays, totalSla } from "./sla-engine";
import { addCalendarDays, diffWorkingDays } from "./working-days";

export interface StepStatSummary {
  n: number;
  avg: number;
  sla: number | null;
  ok: number | null;
  max: number;
  rec: number | null;
  old: number | null;
}

export interface PhaseSummary {
  k: string;
  n: number;
  avg: number;
  sla: number;
  ok: number;
}

export interface DepartmentImprovementCard {
  roleKey: string;
  name: string;
  overCount: number;
  totalWithSla: number;
  worstStep: { lab: string; diff: number; okPct: string } | null;
  maxVal: number;
  rows: Array<{ k: string; lab: string; subHint: string; stat: StepStatSummary }>;
}

const DEPTS_DEF: Array<[string, string, Array<[string, string]>]> = [
  ["import", "Import", [["_create", "เตรียมข้อมูล / แจ้งงาน"], ["Info Incomplete", "ส่งข้อมูลเพิ่ม"], ["Send to Factory", "ส่ง AW ให้โรงงาน + SKU"]]],
  ["designer", "Designer", [["Info Checking", "ตรวจข้อมูล & Brief (Y/N)"], ["Drafting", "ออกแบบ Draft"], ["Revising", "แก้ไข Draft"], ["Present AW", "Present AW ให้ EVP"], ["EVP Revising", "แก้ตามคอมเมนต์ EVP"], ["Final AW", "Submit Final AW"]]],
  ["photographer", "Photographer", [["Photo Shoot", "ถ่ายรูปสินค้า"]]],
  ["mdsg", "Import + MDSG · ตรวจ Draft ร่วม", [["_review", "ตรวจ Draft (Import → MDSG)"], ["_revI", "ส่วนของ Import"], ["_revM", "ส่วนของ MDSG"]]],
  ["evp", "EVP MDSG", [["EVP Review", "พิจารณาอนุมัติ AW"]]],
  ["factory", "Factory / Logistic", [["In Production", "ผลิต + ขนส่ง (Leadtime + 20)"]]],
];

export function computeImprovementDashboard(
  jobs: JobRecord[],
  today: string,
  holidays: ReadonlySet<string>
): { phases: PhaseSummary[]; departments: DepartmentImprovementCard[] } {
  const seg: Record<string, Array<{ days: number; sla: number | null; start: string }>> = {};
  const add = (k: string, days: number, sla: number | null, start: string) => {
    const arr = seg[k] ?? [];
    arr.push({ days, sla, start });
    seg[k] = arr;
  };

  jobs.forEach((j) => {
    const h = j.history;
    const c = h.find((e) => e.mark === "create");
    if (c) add("_create", diffWorkingDays(j.piDate, c.d, holidays), jobPattern(j).info, c.d);
    h.forEach((e, i) => {
      const n1 = h[i + 1];
      const n2 = h[i + 2];
      if (n1 && e.sub === "Import Review" && n1.sub === "MDSG Review" && n2) {
        add("_review", diffWorkingDays(e.d, n2.d, holidays), 2, e.d);
        add("_revI", diffWorkingDays(e.d, n1.d, holidays), null, e.d);
        add("_revM", diffWorkingDays(n1.d, n2.d, holidays), null, n1.d);
      }
      if (n1 && e.sub !== "Import Review" && e.sub !== "MDSG Review") {
        const def = SUB_MAP[e.sub as SubStatus];
        if (def && (def.sla != null || e.sub === "In Production")) {
          const sla = e.sub === "In Production" ? (j.leadtime ?? 55) + 20 : def.sla;
          add(e.sub, diffWorkingDays(e.d, n1.d, holidays), sla, e.d);
        }
      }
    });
  });

  const cut = addCalendarDays(today, -90);
  const calcStat = (k: string): StepStatSummary | null => {
    const a = seg[k];
    if (!a?.length) return null;
    const avg = a.reduce((x, y) => x + y.days, 0) / a.length;
    const firstSla = a[0]!.sla;
    const sla = firstSla == null ? null : a.reduce((x, y) => x + (y.sla ?? 0), 0) / a.length;
    const rec = a.filter((x) => x.start >= cut);
    const old = a.filter((x) => x.start < cut);
    const mean = (L: typeof a) => (L.length ? L.reduce((x, y) => x + y.days, 0) / L.length : null);
    return {
      n: a.length,
      avg,
      sla,
      ok: sla == null ? null : a.filter((x) => x.days <= (x.sla ?? 0)).length,
      max: Math.max(...a.map((x) => x.days)),
      rec: mean(rec),
      old: mean(old),
    };
  };

  const buildPhase = (k: string, fn: (j: JobRecord) => [number, number] | null): PhaseSummary | null => {
    const L = jobs.map(fn).filter((x): x is [number, number] => x !== null);
    if (!L.length) return null;
    return {
      k,
      n: L.length,
      avg: L.reduce((x, y) => x + y[0], 0) / L.length,
      sla: L.reduce((x, y) => x + y[1], 0) / L.length,
      ok: L.filter((x) => x[0] <= x[1]).length,
    };
  };

  const phases = [
    buildPhase("ช่วง Info · PI อนุมัติ → Info Complete", (j) => {
      const i = dateOfMark(j, "info");
      const p = jobPattern(j);
      return i ? [diffWorkingDays(j.piDate, i, holidays), p.info + p.brief + (j.photo ? 7 : 0)] : null;
    }),
    buildPhase("ช่วง AW · Info Complete → Final AW", (j) => {
      const i = dateOfMark(j, "info");
      const f = dateOfMark(j, "final");
      return i && f ? [diffWorkingDays(i, f, holidays), jobPattern(j).aw + extraItemDays(j.items)] : null;
    }),
    buildPhase("ช่วง Production · Final AW → สินค้าเข้า", (j) => {
      const f = dateOfMark(j, "final");
      const g = dateOfMark(j, "gr");
      const p = jobPattern(j);
      return f && g ? [diffWorkingDays(f, g, holidays), p.prod + p.log + licenseDays(j.license)] : null;
    }),
    buildPhase("รวม · PI อนุมัติ → สินค้าเข้า", (j) => {
      const g = dateOfMark(j, "gr");
      return g ? [diffWorkingDays(j.piDate, g, holidays), totalSla(j)] : null;
    }),
  ].filter((p): p is PhaseSummary => p !== null);

  const departments: DepartmentImprovementCard[] = [];
  for (const [roleKey, name, steps] of DEPTS_DEF) {
    const rows = steps
      .map(([k, lab]) => ({
        k,
        lab,
        subHint: k === "_create" ? "Open · Old SKU 2 / New SKU 7" : k === "_review" ? "Import Review + MDSG Review" : k,
        stat: calcStat(k),
      }))
      .filter((r): r is { k: string; lab: string; subHint: string; stat: StepStatSummary } => r.stat !== null);
    if (!rows.length) continue;
    const withSla = rows.filter((x) => x.stat.sla != null);
    const over = withSla.filter((x) => x.stat.avg > (x.stat.sla ?? 0) + 0.05);
    const sortedWorst = [...over].sort((a, b) => (b.stat.avg - (b.stat.sla ?? 0)) - (a.stat.avg - (a.stat.sla ?? 0)));
    const w = sortedWorst[0];
    departments.push({
      roleKey,
      name,
      overCount: over.length,
      totalWithSla: withSla.length,
      worstStep: w
        ? {
            lab: w.lab,
            diff: w.stat.avg - (w.stat.sla ?? 0),
            okPct: w.stat.n ? `${Math.round(((w.stat.ok ?? 0) / w.stat.n) * 100)}%` : "–",
          }
        : null,
      maxVal: Math.max(...rows.map((x) => Math.max(x.stat.avg, x.stat.sla ?? 0))) * 1.15,
      rows,
    });
  }

  return { phases, departments };
}
