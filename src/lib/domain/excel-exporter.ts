import {
  DESIGNER_NAMES,
  ROLE_TH,
  sdeptLabel,
  STATUS_LIST,
  SUB_MAP,
  type SubStatus,
} from "./aw-constants";
import type { JobRecord } from "./job-types";
import {
  awDeltaDays,
  awDueDays,
  curStatus,
  curSub,
  dateOfMark,
  dayInStage,
  isOpenJob,
  isOverdue,
  jobPattern,
  ownerLabel,
  roundsCount,
  slaOf,
  stageStart,
  totalSla,
} from "./sla-engine";
import { addWorkingDays, diffWorkingDays, fmtThaiDate } from "./working-days";
import { buildXlsxWorkbookBuffer, type XlsxCellValue } from "./xlsx-xml-builder";

const PHASES: Array<[string, string[], string]> = [
  ["ตรวจข้อมูล & Brief", ["Info Checking", "Info Incomplete"], "2"],
  ["ถ่ายรูปสินค้า", ["Photo Shoot"], "7"],
  ["ออกแบบ Draft", ["Drafting"], "7"],
  ["Import + MDSG ตรวจ", ["Import + MDSG Review"], "2/รอบ"],
  ["แก้ไข Draft", ["Revising"], "3/รอบ"],
  ["Present + EVP", ["Present AW", "EVP Review", "EVP Revising"], "1/ขั้น"],
  ["Final AW + ส่งโรงงาน", ["Final AW", "Send to Factory"], "1/ขั้น"],
  ["ผลิต + ขนส่ง", ["In Production"], "Leadtime+20"],
];

function buildStepRows(j: JobRecord, today: string, holidays: ReadonlySet<string>) {
  const h = j.history;
  const out: Array<{ name: string; st: string; who: string; start: string; end: string | null; days: number; sla: number | null; cur: boolean; act: string; note: string }> = [];
  for (let i = 0; i < h.length; i++) {
    const e = h[i]!;
    if (e.sub === "Goods Received" || e.sub === "Cancelled") continue;
    let name: string = e.sub;
    const sla = slaOf(j, e.sub);
    let k = i;
    if (e.sub === "Import Review" && h[i + 1]?.sub === "MDSG Review") {
      name = "Import + MDSG Review";
      k = i + 1;
    } else if (e.sub === "Import Review" || e.sub === "MDSG Review") {
      name = "Import + MDSG Review";
    }
    const nx = h[k + 1];
    const end = nx ? nx.d : null;
    const days = diffWorkingDays(e.d, end ?? today, holidays);
    const fin = h[k]!;
    const who = [...new Set([e.sub, fin.sub].flatMap((x) => SUB_MAP[x].roles))].map((x) => ROLE_TH[x] ?? x).join(" / ");
    out.push({ name, st: SUB_MAP[e.sub].st, who, start: e.d, end, days, sla, cur: !nx, act: fin.act || e.act || "", note: [e.note, fin !== e ? fin.note : ""].filter(Boolean).join(" | ") });
    i = k;
  }
  return out;
}

export async function buildJobsReportXlsx(
  jobs: JobRecord[],
  today: string,
  holidays: ReadonlySet<string>,
  filterSummary: string
): Promise<Buffer> {
  const F = [...jobs].sort((a, b) => b.piDate.localeCompare(a.piDate));
  const H = (h: string): XlsxCellValue => ({ v: h, s: 1 });
  const D = (d: string | null | undefined): XlsxCellValue => (d ? { d } : "");
  const sg = (n: number | null, good?: boolean): XlsxCellValue => (n == null ? "" : { v: n, s: n > 0 ? 5 : good ? 6 : 11 });

  const H2 = ["PI No.", "PI อนุมัติ", "House Brand", "Supplier", "Sdept 1", "Sdept 2", "Sdept 3", "Pattern", "Items", "License", "ประชุม Brief", "Status", "Sub Status", "ค้างที่ (ผู้รับผิดชอบ)", "เริ่มขั้นนี้", "วันในขั้นนี้", "SLA ขั้นนี้", "ผล SLA ขั้นนี้", "รอบแก้ Draft", "วันรวมตั้งแต่ PI อนุมัติ", "ครบกำหนด Final AW", "+/- วัน Final AW", "วันที่ Final AW จริง", "ครบกำหนดสินค้าเข้า", "+/- วัน สินค้าเข้า", "วันที่สินค้าเข้า (SKU แรก)", "On-time Overall", "PO Number", "Designer", "Import", "Link Share Folder"];
  const r2: XlsxCellValue[][] = [H2.map(H)];
  F.forEach((j) => {
    const sd = j.sdepts;
    const open = isOpenJob(j);
    const s = curSub(j);
    const sla = slaOf(j);
    const di = open ? dayInStage(j, today, holidays) : null;
    const fin = dateOfMark(j, "final");
    const gr = dateOfMark(j, "gr");
    const awD = addWorkingDays(j.piDate, awDueDays(j), holidays);
    const grD = addWorkingDays(j.piDate, totalSla(j), holidays);
    const res = !open || sla == null || di == null ? "" : di > sla ? `เกิน ${di - sla} วัน` : "ทัน";
    const ot = s === "Cancelled" ? "" : gr ? (diffWorkingDays(j.piDate, gr, holidays) <= totalSla(j) ? "ทัน" : "ช้า") : (diffWorkingDays(j.piDate, today, holidays) > totalSla(j) ? "Pending เลยกำหนด" : "Pending ยังไม่ถึงกำหนด");
    r2.push([
      { v: j.pi, s: 9 }, D(j.piDate), j.brand, j.supplier,
      sd[0] ? sdeptLabel(sd[0]) : "", sd[1] ? sdeptLabel(sd[1]) : "", sd[2] ? sdeptLabel(sd[2]) : "",
      jobPattern(j).name, j.items, j.license, j.brief, curStatus(j), s, open ? ownerLabel(j) : "",
      open ? D(stageStart(j)) : "", di, open ? sla : "",
      res ? { v: res, s: res === "ทัน" ? 14 : 4 } : "", roundsCount(j),
      diffWorkingDays(j.piDate, gr ?? today, holidays), D(awD),
      fin || !open ? "" : sg(diffWorkingDays(awD, today, holidays)), D(fin),
      s === "Cancelled" ? "" : D(grD), gr || !open ? "" : sg(diffWorkingDays(grD, today, holidays)),
      D(gr), ot ? { v: ot, s: ot === "ทัน" ? 14 : /ช้า|เลย/.test(ot) ? 4 : 0 } : "",
      j.poNumber ?? "", j.designer, j.importer, j.folder,
    ]);
  });

  const r3: XlsxCellValue[][] = [["PI No.", "House Brand", "Designer", "Status", "Sub Status ปัจจุบัน", "PI อนุมัติ → แจ้งงาน", ...PHASES.map((p) => `${p[0]}\n(SLA ${p[2]})`), "รวม (วันทำงาน)", "SLA รวม", "ผล"].map(H)];
  F.forEach((j) => {
    const st = buildStepRows(j, today, holidays);
    const curN = isOpenJob(j) && st.length ? st[st.length - 1]!.name : "";
    const pre = diffWorkingDays(j.piDate, j.history[0]?.d ?? j.piDate, holidays);
    let tot = pre;
    const cells: XlsxCellValue[] = PHASES.map((p) => {
      const rs = st.filter((x) => p[1].includes(x.name));
      if (!rs.length) return "";
      const n = rs.reduce((a, x) => a + x.days, 0);
      tot += n;
      return p[1].includes(curN) ? { v: n, s: 10 } : n;
    });
    const ts = totalSla(j);
    const done = Boolean(dateOfMark(j, "gr"));
    const outcome: XlsxCellValue = curSub(j) === "Cancelled" ? "" : done ? (tot <= ts ? { v: "ทัน", s: 14 } : { v: `ช้า ${tot - ts} วัน`, s: 4 }) : (tot > ts ? { v: `เกินแล้ว ${tot - ts} วัน`, s: 4 } : { v: `เหลือ ${ts - tot} วัน`, s: 0 });
    r3.push([{ v: j.pi, s: 9 }, j.brand, j.designer, curStatus(j), curSub(j), pre, ...cells, { v: tot, s: 12 }, ts, outcome]);
  });

  const r4: XlsxCellValue[][] = [["PI No.", "House Brand", "Designer", "Import", "ลำดับ", "ขั้นตอน (Sub Status)", "Status", "ผู้รับผิดชอบ", "วันเริ่ม", "วันจบ", "จำนวนวัน", "SLA", "ผล", "เสร็จแล้ว?", "ผลลัพธ์ / การดำเนินการ", "หมายเหตุ"].map(H)];
  F.forEach((j) => {
    buildStepRows(j, today, holidays).forEach((x, idx) => {
      const ov = x.sla != null && x.days > x.sla;
      r4.push([j.pi, j.brand, j.designer, j.importer, idx + 1, x.name, x.st, x.who, D(x.start), x.end ? D(x.end) : "", x.cur ? { v: x.days, s: 10 } : x.days, x.sla ?? "", x.sla == null ? "" : ov ? { v: `เกิน ${x.days - x.sla}`, s: 4 } : { v: "ทัน", s: 14 }, x.cur ? "กำลังทำ" : "เสร็จ", x.cur ? "" : x.act, x.note]);
    });
  });

  const op = F.filter(isOpenJob);
  const r1: XlsxCellValue[][] = [
    [{ v: "รายงานงานออกแบบ AW Packaging", s: 7 }],
    [{ v: `ข้อมูล ณ ${fmtThaiDate(today)} · ตัวกรอง: ${filterSummary}`, s: 8 }],
    [{ v: "นับเป็นวันทำงาน (ไม่รวมเสาร์-อาทิตย์และวันหยุด) · ช่องสีเหลือง = ขั้นที่งานอยู่ตอนนี้ · ตัวเลข + สีแดง = เลยกำหนด, − สีเขียว = ยังเหลือเวลา", s: 8 }],
    [],
    [H("Status"), H("จำนวน PI"), H("Items"), H("เกิน SLA ขั้นปัจจุบัน")],
  ];
  STATUS_LIST.forEach((s) => {
    const g = F.filter((j) => curStatus(j) === s);
    if (g.length) r1.push([s, g.length, g.reduce((a, j) => a + j.items, 0), g.filter((j) => isOverdue(j, today, holidays)).length || ""]);
  });
  r1.push([{ v: "รวม", s: 9 }, { v: F.length, s: 12 }, { v: F.reduce((a, j) => a + j.items, 0), s: 12 }, { v: F.filter((j) => isOverdue(j, today, holidays)).length, s: 12 }]);
  r1.push([], [H("งานที่ยังค้าง · Sub Status"), H("ค้างที่"), H("จำนวน PI"), H("เกิน SLA"), H("เฉลี่ยวันในขั้น"), H("SLA (วัน)")]);
  (Object.keys(SUB_MAP) as SubStatus[]).forEach((s) => {
    const g = op.filter((j) => curSub(j) === s);
    if (!g.length) return;
    const o = g.filter((j) => isOverdue(j, today, holidays)).length;
    r1.push([s, ownerLabel(g[0]!), g.length, o ? { v: o, s: 5 } : "", Math.round((g.reduce((a, j) => a + dayInStage(j, today, holidays), 0) / g.length) * 10) / 10, s === "In Production" ? "Leadtime+20" : slaOf(g[0]!)]);
  });
  r1.push([], [H("Designer"), H("งานค้าง"), H("อยู่ที่ Designer"), H("เกิน SLA"), H("ยังไม่ส่ง Final AW"), H("Final AW เลยกำหนด")]);
  DESIGNER_NAMES.forEach((d) => {
    const g = op.filter((j) => j.designer === d);
    if (!g.length) return;
    const nf = g.filter((j) => !dateOfMark(j, "final"));
    const late = nf.filter((j) => awDeltaDays(j, today, holidays) > 0).length;
    r1.push([d, g.length, g.filter((j) => SUB_MAP[curSub(j)].roles.includes("designer")).length, g.filter((j) => isOverdue(j, today, holidays)).length || "", nf.length, late ? { v: late, s: 5 } : ""]);
  });

  const r5: XlsxCellValue[][] = [
    [H("คอลัมน์"), H("ความหมาย / วิธีคำนวณ")],
    ["วันในขั้นนี้", "วันทำงานตั้งแต่งานเข้าขั้นปัจจุบันจนถึงวันที่ Export (ขั้น Import + MDSG นับรวมกันตั้งแต่ Designer ส่ง Draft)"],
    ["ผล SLA ขั้นนี้", "ทัน = ยังไม่เกิน SLA ของขั้น · เกิน x วัน = เลย SLA ของขั้นไปแล้ว"],
    ["ครบกำหนด Final AW", "PI อนุมัติ + เตรียมข้อมูล + ตรวจข้อมูล & Brief 2 วัน + SLA AW (+7 ถ่ายรูปใหม่, +7 ทุก 30 SKUs ที่เกิน 30)"],
    ["ครบกำหนดสินค้าเข้า", "PI อนุมัติ + SLA รวมตาม Pattern + ส่วนเพิ่ม (Items / ถ่ายรูปใหม่ / TISI +90 / อย. +60)"],
    ["On-time Overall", "ทัน / ช้า = เทียบวันสินค้าเข้าจริงกับ SLA รวม · Pending = สินค้ายังไม่เข้า"],
  ];

  return buildXlsxWorkbookBuffer([
    { name: "สรุป", rows: r1, cols: [34, 18, 14, 18, 18, 18], hts: { 1: 26 } },
    { name: "รายการงาน", rows: r2, cols: [15, 11, 16, 18, 24, 22, 22, 30, 8, 13, 11, 13, 16, 20, 11, 10, 9, 13, 9, 12, 13, 10, 13, 13, 10, 14, 20, 16, 16, 16, 36], freeze: [1, 1], filter: 1, hts: { 1: 36 } },
    { name: "วันในแต่ละขั้น", rows: r3, cols: [15, 16, 16, 13, 16, 12, ...PHASES.map(() => 14), 12, 10, 18], freeze: [1, 1], filter: 1, hts: { 1: 44 } },
    { name: "ประวัติขั้นตอน", rows: r4, cols: [15, 16, 16, 16, 7, 22, 12, 16, 11, 11, 10, 8, 10, 10, 34, 40], freeze: [1, 1], filter: 1, hts: { 1: 32 } },
    { name: "คำอธิบาย", rows: r5, cols: [28, 100] },
  ]);
}
