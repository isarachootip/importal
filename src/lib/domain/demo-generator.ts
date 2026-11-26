import {
  BRANDS,
  BU_LIST,
  CANCEL_REASONS,
  DESIGNER_NAMES,
  IMPORTER_NAMES,
  PACKAGES,
  SUPPLIERS,
  type SubStatus,
} from "./aw-constants";
import { simulateJobHistory } from "./demo-simulator";
import { SDEPT_MASTER } from "./directory-import-design";
import type { HistoryMark, JobRecord } from "./job-types";
import { addCalendarDays, calendarDiff } from "./working-days";

export function hashString(text: string): number {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDemoJobs(today: string, holidays: ReadonlySet<string>): JobRecord[] {
  const r = createRng(20261124);
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;

  const yearStart = addCalendarDays(today, -323);
  const recentAnchor = addCalendarDays(today, -43);
  const cutoff = addCalendarDays(today, -175);
  const span = Math.max(30, calendarDiff(yearStart, addCalendarDays(today, -3)));
  const list: JobRecord[] = [];

  for (let i = 0; i < 78; i++) {
    const piDate = i < 60
      ? addCalendarDays(yearStart, Math.floor(Math.pow(r(), 0.75) * span))
      : addCalendarDays(recentAnchor, Math.floor(r() * 40));
    const pw = r();
    const pattern = pw < 0.3 ? 2 : pw < 0.55 ? 3 : pw < 0.8 ? 4 : 5;
    const lr = r();
    const sd = pick(SDEPT_MASTER);
    const sd2 = r() < 0.3 ? pick(SDEPT_MASTER) : null;
    const pi = `PI-${piDate.slice(2, 4)}${piDate.slice(5, 7)}-${String(i + 1).padStart(3, "0")}`;
    const license = piDate < cutoff
      ? lr < 0.7 ? "ไม่มี" : lr < 0.86 ? "TISI (มอก.)" : "อย."
      : lr < 0.88 ? "ไม่มี" : lr < 0.95 ? "TISI (มอก.)" : "อย.";

    const job: JobRecord = {
      id: `J${1001 + i}`,
      jobCode: `J${1001 + i}`,
      pi,
      piDate,
      bu: pick(BU_LIST),
      supplier: pick(SUPPLIERS),
      brand: pick(BRANDS),
      pattern,
      sdept: sd.code,
      sdepts: sd2 && sd2.code !== sd.code ? [sd.code, sd2.code] : [sd.code],
      folder: `https://drive.example.com/AW-Packaging/${pi}`,
      items: ri(4, 72),
      license,
      packages: [...new Set([pick(PACKAGES), pick(PACKAGES)])],
      importer: pick(IMPORTER_NAMES.slice(0, 12)),
      designer: pick(DESIGNER_NAMES),
      brief: "N",
      photo: false,
      history: [],
      edits: [],
      files: [],
      skus: [],
    };
    simulateJobHistory(job, today, recentAnchor, holidays, r, ri, pick);
    list.push(job);
  }

  type StepPreset = [SubStatus, string, string, string?, HistoryMark?];
  const P: Record<string, StepPreset> = {
    info: ["Drafting", "designer", "Confirm Info Complete", "", "info"],
    d1: ["Import Review", "designer", "ส่ง Draft รอบ 1"],
    ipf: ["MDSG Review", "import", "Import: Fail → ส่งให้ MDSG ตรวจ", "แก้สี / ฟอนต์ / โลโก้ · ขอปรับโลโก้ให้ใหญ่ขึ้น"],
    f1: ["Revising", "mdsg", "สรุปผลตรวจ รอบ 1: Import Fail · MDSG Pass → ส่งกลับแก้ไข", "Import: แก้สี / ฟอนต์ / โลโก้ · ขอปรับโลโก้ให้ใหญ่ขึ้น | MDSG: Pass", "fail"],
    d2: ["Import Review", "designer", "ส่ง Draft รอบ 2"],
    ip: ["MDSG Review", "import", "Import: Pass → ส่งให้ MDSG ตรวจ"],
    pass: ["Present AW", "mdsg", "สรุปผลตรวจ: Import Pass · MDSG Pass → Confirm AW", "", "confirm"],
    pres: ["EVP Review", "designer", "Present AW ให้ EVP"],
    appr: ["Final AW", "evp", "EVP อนุมัติ AW"],
    fin: ["Send to Factory", "designer", "Submit Final AW (.ai / .pdf)", "", "final"],
    inc: ["Info Incomplete", "designer", "ข้อมูลไม่ครบ ส่งกลับ Import", "ขาด: Shipping Mark, มอก."],
    ph: ["Photo Shoot", "designer", "ไม่มีรูปสินค้าจากโรงงาน → ส่งถ่ายรูป"],
  };

  const showcase: Array<[number, Array<[string, number]>, number]> = [
    [3, [["ph", 2]], 3], [5, [["ph", 1]], 8], [3, [["inc", 5]], 3],
    [4, [["info", 2], ["d1", 7]], 4], [5, [["info", 3], ["d1", 8]], 1],
    [2, [["info", 2], ["d1", 6], ["ipf", 1], ["f1", 1], ["d2", 3]], 1],
    [4, [["info", 4], ["d1", 7], ["ip", 1], ["pass", 2]], 2],
    [5, [["info", 2], ["d1", 8], ["ip", 1], ["pass", 2], ["pres", 1]], 3],
    [3, [["info", 3], ["d1", 7], ["ipf", 1], ["f1", 1]], 5],
    [2, [["info", 2], ["d1", 6], ["ip", 1], ["pass", 2], ["pres", 1], ["appr", 2], ["fin", 1]], 2],
    [3, [["info", 3], ["d1", 7], ["ip", 1], ["pass", 2], ["pres", 1]], 1],
    [3, [["info", 3], ["d1", 6], ["ip", 1]], 1],
    [5, [["info", 2], ["d1", 7], ["ipf", 1]], 3],
  ];

  showcase.forEach(([p, path, ago], k) => {
    const sd = pick(SDEPT_MASTER);
    let d = addCalendarDays(today, -(path.reduce((a, x) => a + x[1], 0) + ago) - 4);
    const piDate = addCalendarDays(d, -4);
    const idx = list.length;
    const pi = `PI-${piDate.slice(2, 4)}${piDate.slice(5, 7)}-${String(idx + 1).padStart(3, "0")}`;
    const job: JobRecord = {
      id: `J${1001 + idx}`,
      jobCode: `J${1001 + idx}`,
      pi,
      piDate,
      bu: pick(BU_LIST),
      supplier: pick(SUPPLIERS),
      brand: pick(BRANDS),
      pattern: p,
      sdept: sd.code,
      sdepts: [sd.code],
      folder: `https://drive.example.com/AW-Packaging/${pi}`,
      items: ri(6, 40),
      license: "ไม่มี",
      packages: [pick(PACKAGES)],
      importer: k < 3 ? "คุณหมู" : pick(IMPORTER_NAMES.slice(0, 12)),
      designer: k < 4 ? "คุณพีท" : pick(DESIGNER_NAMES),
      brief: k % 2 === 0 ? "Y" : "N",
      photo: path.some((x) => x[0] === "ph"),
      history: [{ sub: "Info Checking", d, by: "import", act: "แจ้งงานออกแบบ (Create Job)", note: "", mark: "create" }],
      edits: [],
      files: [],
      skus: [],
    };
    d = addCalendarDays(d, 4);
    path.forEach(([key, gap]) => {
      const preset = P[key]!;
      d = addCalendarDays(d, gap);
      job.history.push({ sub: preset[0], d, by: preset[1], act: preset[2], note: preset[3] ?? "", mark: preset[4] });
    });
    list.push(job);
  });

  const openList = list.filter((j) => !["Goods Received", "Cancelled"].includes(j.history.at(-1)!.sub));
  for (let k = 0; k < 6; k++) {
    const j = openList[Math.floor(r() * openList.length)];
    if (!j || ["Goods Received", "Cancelled"].includes(j.history.at(-1)!.sub)) continue;
    const lastDate = j.history.at(-1)!.d;
    const d = addCalendarDays(lastDate, Math.min(ri(1, 6), Math.max(0, calendarDiff(lastDate, today))));
    if (k >= 4) j.history.push({ sub: "Cancelled", d, by: "import", act: "ยกเลิกงาน", note: pick(CANCEL_REASONS) });
    else r();
  }

  list.forEach((j) => {
    const fin = j.history.find((h) => h.mark === "final")?.d;
    const lastSub = j.history.at(-1)!.sub;
    if (fin && ["In Production", "Goods Received"].includes(lastSub)) {
      const rr = createRng(hashString(j.pi));
      const gr = j.history.find((h) => h.mark === "gr")?.d ?? null;
      j.skus = Array.from({ length: Math.min(j.items, 40) }, (_, idx) => {
        const sku = String(1000000 + Math.floor(rr() * 8999999));
        const cand = gr ? addCalendarDays(gr, Math.floor(rr() * 12)) : null;
        return {
          sku,
          created: addCalendarDays(fin, -Math.floor(rr() * 40)),
          gr: gr ? (idx === 0 ? gr : cand && cand <= today ? cand : null) : null,
        };
      });
    }
  });

  return list;
}
