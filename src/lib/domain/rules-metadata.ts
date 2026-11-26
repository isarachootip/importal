import type { MainStatus } from "./aw-constants";

export interface RuleStepItem {
  key: string;
  status: MainStatus;
  title: string;
  role: string;
  startWhen: string;
  stopWhen: string;
  slaOverride: string | number | null;
  source: string;
  state: "done" | "assume" | "file";
  extraNote: string;
}

export const RULE_STEPS: RuleStepItem[] = [
  { key: "_create", status: "Open", title: "เตรียมข้อมูล / แจ้งงาน", role: "import", startWhen: "PI approval date by EVP", stopWhen: "กด Send แจ้งงาน", slaOverride: "Old SKU 2 / New SKU 7", source: "ปรับ 26 พ.ย.: Pattern 2), 4) = 2 วัน · Pattern 3), 5) = 7 วัน (เดิม 4 / 9)", state: "done", extraNote: "" },
  { key: "Info Checking", status: "Open", title: "ตรวจข้อมูล & Brief (Y/N)", role: "designer", startWhen: "แจ้งงาน / ได้ข้อมูลเพิ่ม", stopWhen: "บันทึกผลตรวจข้อมูล", slaOverride: null, source: "Review 25 พ.ย.: 2 วัน และระบุว่าต้อง Brief หรือไม่ (Y/N)", state: "done", extraNote: "" },
  { key: "Photo Shoot", status: "Open", title: "ถ่ายรูปสินค้า", role: "photographer", startWhen: "Designer ส่งถ่ายรูป", stopWhen: "อัปโหลดรูปลง Share Folder", slaOverride: null, source: "OLD: ถ่ายรูปสินค้าใหม่ +7 วัน", state: "done", extraNote: "" },
  { key: "Info Incomplete", status: "Open", title: "ส่งข้อมูลเพิ่มเติม", role: "import", startWhen: "Designer ตีกลับข้อมูลไม่ครบ", stopWhen: "Import ส่งข้อมูลเพิ่ม", slaOverride: null, source: "Review 25 พ.ย.: 2 วัน", state: "done", extraNote: "" },
  { key: "Drafting", status: "Draft AW", title: "ออกแบบ Draft", role: "designer", startWhen: "Confirm Info Complete", stopWhen: "ส่ง Draft", slaOverride: null, source: "Input Data: 7 Days after Info complete", state: "done", extraNote: "" },
  { key: "_review", status: "Draft AW", title: "Import + MDSG ตรวจ Draft (รวม)", role: "import", startWhen: "Designer ส่ง Draft", stopWhen: "MDSG บันทึกผล (สรุปผลรวม)", slaOverride: 2, source: "Review 25 พ.ย.: Import และ MDSG ตรวจรวมกัน 2 วัน", state: "done", extraNote: "Import ตรวจก่อน แล้วส่งต่อ MDSG ทุกกรณี" },
  { key: "Revising", status: "Draft AW", title: "แก้ไข Draft", role: "designer", startWhen: "สรุปผลตรวจ (ไม่ผ่าน)", stopWhen: "ส่ง Draft แก้ไข", slaOverride: null, source: "Input Data: 3 Days after getting feedback", state: "done", extraNote: "" },
  { key: "Present AW", status: "Draft AW", title: "Present AW ให้ EVP", role: "designer", startWhen: "Confirm AW (Pass ทั้ง 2 ทีม)", stopWhen: "Present AW", slaOverride: null, source: "Input Data: 1 Day after getting feedback", state: "done", extraNote: "" },
  { key: "EVP Review", status: "Draft AW", title: "EVP พิจารณาอนุมัติ", role: "evp", startWhen: "Present AW", stopWhen: "EVP อนุมัติ / ไม่อนุมัติ", slaOverride: null, source: "Review 25 พ.ย.: 1 วัน", state: "done", extraNote: "" },
  { key: "EVP Revising", status: "Draft AW", title: "แก้ไขตามคอมเมนต์ EVP", role: "designer", startWhen: "EVP ไม่อนุมัติ", stopWhen: "ส่ง AW แก้ไข", slaOverride: null, source: "Input Data: 1 Day after getting feedback", state: "done", extraNote: "" },
  { key: "Final AW", status: "Final AW", title: "Submit Final AW", role: "designer", startWhen: "EVP อนุมัติ", stopWhen: "อัปโหลด Final AW (.ai / .pdf)", slaOverride: null, source: "Input Data: 1 Day after getting approval", state: "done", extraNote: "" },
  { key: "Send to Factory", status: "Production", title: "ส่ง AW ให้โรงงาน + Leadtime + SKU", role: "import", startWhen: "Submit Final AW", stopWhen: "บันทึก Leadtime + Upload SKU", slaOverride: null, source: "Input Data: 1 Day after receiving Final AW", state: "done", extraNote: "" },
  { key: "In Production", status: "Production", title: "ผลิต + ขนส่ง", role: "factory", startWhen: "บันทึก Leadtime + SKU", stopWhen: "SKU แรกเข้า (API: PI + SKU)", slaOverride: "Leadtime + 20", source: "OLD: Inspection + Logistic 20 วัน", state: "done", extraNote: "Leadtime ตามที่ Import กรอก · นับเป็นวันทำงานเหมือนขั้นอื่น" },
];

export interface RuleKpiItem {
  name: string;
  start: string;
  stop: string;
  compareTo: string;
  note: string;
}

export const RULE_KPI: RuleKpiItem[] = [
  { name: "On-time Overall", start: "PI Approval date by EVP", stop: "Goods Received (วันที่ SKU แรกเข้า)", compareTo: "SLA ตาม Pattern (รวมตรวจข้อมูล & Brief 2 วัน) + เกิน 30 SKUs +7/30 SKUs + ถ่ายรูปใหม่ +7 + TISI +90 / อย. +60", note: "นับเฉพาะ PI ที่สินค้าเข้าแล้ว · ไม่รวม Cancelled" },
  { name: "On-time Designer", start: "Confirm Info Complete", stop: "Submit Final AW", compareTo: "SLA AW ตาม Pattern (15 / 15 / 25 / 25)", note: "รวมงานที่ขอ TISI / อย. (ใบอนุญาตไม่กระทบช่วงออกแบบ)" },
  { name: "% On-time รายเดือน", start: "PI Approval date by EVP", stop: "Goods Received", compareTo: "เหมือน On-time Overall", note: "จัดกลุ่มตามเดือน PI Approval · Pending = ยังไม่รับสินค้า · ไม่รวม Cancelled" },
  { name: "Pending เลยกำหนดแล้ว", start: "PI Approval date by EVP", stop: "วันนี้", compareTo: "SLA รวมของ PI", note: "ยังไม่รับสินค้า แต่วันนี้เลยกำหนดสินค้าเข้าแล้ว" },
  { name: "เกิน SLA ขั้นปัจจุบัน", start: "วันที่เข้าขั้นปัจจุบัน", stop: "วันนี้", compareTo: "SLA ของขั้น (ตารางด้านบน)", note: "ใช้ในหน้า \"งานของฉัน\" และส่วน ③ ของ Dashboard" },
  { name: "+/- Day Final AW", start: "PI Approval date by EVP", stop: "วันนี้", compareTo: "เตรียมข้อมูล + ตรวจ & Brief 2 + SLA AW (+ ถ่ายรูปใหม่ / เกิน 30 SKUs)", note: "+ = เลยกำหนด · − = เหลืออีกกี่วัน · เฉพาะงานที่ยังไม่ส่ง Final AW" },
  { name: "+/- Day สินค้าเข้า", start: "PI Approval date by EVP", stop: "วันนี้", compareTo: "SLA รวมของ PI", note: "+ = เลยกำหนด · − = เหลืออีกกี่วัน" },
  { name: "รอบแก้ Draft", start: "–", stop: "–", compareTo: "–", note: "+1 ทุกครั้งที่สรุปผลตรวจไม่ผ่าน (Import หรือ MDSG) และทุกครั้งที่ EVP ไม่อนุมัติ" },
  { name: "เฉลี่ยรายขั้น (Improvement)", start: "วันที่เข้าขั้น", stop: "วันที่ออกจากขั้น", compareTo: "SLA ของขั้น", note: "นับเฉพาะขั้นที่ทำเสร็จ · ขั้นที่ทำซ้ำนับทุกครั้ง · เทียบ 3 เดือนล่าสุดกับก่อนหน้า" },
];

export const RULE_Q: Array<[string, string, string]> = [
  ["q1", "SLA ช่วง Info สั้นกว่าผลรวม Timeline รายขั้น · ควรปรับฝั่งไหน", "ปรับตามมาตรฐานรายขั้น: เตรียมข้อมูล (Info) 2 / 7 วัน + ตรวจข้อมูล & Brief (Confirm Info) 2 วัน · SLA รวม 94 / 99 / 104 / 109 (ปรับ 26 พ.ย.)"],
  ["q2", "SLA ของ EVP พิจารณาอนุมัติ ควรเป็นกี่วัน", "1 วัน"],
  ["q3", "SLA ของ Import ส่งข้อมูลเพิ่ม (Info Incomplete) ควรเป็นกี่วัน", "2 วัน"],
  ["q4", "นับเป็นวันปฏิทิน หรือวันทำงาน", "วันทำงาน: ไม่นับเสาร์-อาทิตย์และวันหยุดประจำปี (ดูข้อ 5)"],
  ["q5", "วันที่สินค้าเข้าของ PI ใช้วันที่ SKU สุดท้ายรับครบ หรือวันที่ SKU แรกเข้า", "วันที่ SKU แรกเข้า"],
  ["q6", "เกณฑ์สี % On-time ควรเป็นเท่าไร", "80% (ตามเดิม)"],
  ["q7", "งานที่ต้องรอเลข มอก. / อย. ก่อนทำ Final AW ควรหยุดนับ SLA ของ Designer หรือไม่", "ไม่หยุดนับ · Designer ออกแบบได้"],
];

export type NotifMode = "ทันที" | "สรุปรายวัน" | "ปิด";

export interface NotifEventDef {
  key: string;
  whenLabel: string;
  toDesc: string;
  ccDesc: string;
  todo: string;
  defaultMode: NotifMode;
}

export const NOTIF_DEFS: NotifEventDef[] = [
  { key: "_create", whenLabel: "Import แจ้งงานใหม่", toDesc: "Designer ของงาน", ccDesc: "–", todo: "ตรวจข้อมูล (+ นัดประชุม Brief ถ้า Import เลือก Y)", defaultMode: "ทันที" },
  { key: "Info Incomplete", whenLabel: "Designer ตีกลับ ข้อมูลไม่ครบ", toDesc: "Import เจ้าของงาน", ccDesc: "–", todo: "ส่งข้อมูล / รูปเพิ่มเติม", defaultMode: "ทันที" },
  { key: "Photo Shoot", whenLabel: "ส่งถ่ายรูปสินค้า", toDesc: "Photo Team", ccDesc: "Designer ของงาน", todo: "ถ่ายรูปและอัปโหลดลง Share Folder", defaultMode: "ทันที" },
  { key: "Info Checking", whenLabel: "ได้ข้อมูล / รูปเพิ่มแล้ว", toDesc: "Designer ของงาน", ccDesc: "–", todo: "ตรวจข้อมูลอีกครั้ง", defaultMode: "ทันที" },
  { key: "Drafting", whenLabel: "Confirm Info Complete", toDesc: "Import เจ้าของงาน", ccDesc: "–", todo: "แจ้งให้ทราบ · Designer เริ่มออกแบบ", defaultMode: "ปิด" },
  { key: "Import Review", whenLabel: "Designer ส่ง Draft", toDesc: "Import เจ้าของงาน", ccDesc: "–", todo: "ตรวจ Draft (รวมกับ MDSG 2 วัน)", defaultMode: "ทันที" },
  { key: "MDSG Review", whenLabel: "Import ตรวจเสร็จ ส่งต่อ MDSG", toDesc: "MDSG (Buyer / GM / VP ตาม Sdept)", ccDesc: "–", todo: "ตรวจ Draft และสรุปผลรวม", defaultMode: "ทันที" },
  { key: "Revising", whenLabel: "สรุปผลตรวจ ไม่ผ่าน", toDesc: "Designer ของงาน", ccDesc: "Import เจ้าของงาน", todo: "แก้ไข Draft ตามคอมเมนต์ทั้ง 2 ทีม", defaultMode: "ทันที" },
  { key: "Present AW", whenLabel: "Confirm AW (Pass ทั้ง 2 ทีม)", toDesc: "Designer ของงาน", ccDesc: "Import เจ้าของงาน", todo: "Present AW ให้ EVP", defaultMode: "ทันที" },
  { key: "EVP Review", whenLabel: "Present AW ให้ EVP", toDesc: "K.Chodok (EVP)", ccDesc: "คุณพีท (Designer GM)", todo: "พิจารณาอนุมัติ AW", defaultMode: "ทันที" },
  { key: "EVP Revising", whenLabel: "EVP ไม่อนุมัติ", toDesc: "Designer ของงาน", ccDesc: "Import เจ้าของงาน", todo: "แก้ไขตามคอมเมนต์ EVP", defaultMode: "ทันที" },
  { key: "Final AW", whenLabel: "EVP อนุมัติ AW", toDesc: "Designer ของงาน", ccDesc: "Import เจ้าของงาน", todo: "Submit Final AW (.ai / .pdf)", defaultMode: "ทันที" },
  { key: "Send to Factory", whenLabel: "Submit Final AW แล้ว", toDesc: "Import เจ้าของงาน", ccDesc: "–", todo: "ส่ง AW ให้โรงงาน + ใส่ Leadtime & SKU", defaultMode: "ทันที" },
  { key: "In Production", whenLabel: "ส่งโรงงานแล้ว", toDesc: "Designer ของงาน", ccDesc: "–", todo: "แจ้งให้ทราบ · รอสินค้าเข้า", defaultMode: "ปิด" },
  { key: "Goods Received", whenLabel: "สินค้าเข้า (SKU แรก)", toDesc: "Import เจ้าของงาน", ccDesc: "Designer ของงาน", todo: "แจ้งให้ทราบ · ตรวจรับสินค้า", defaultMode: "ทันที" },
  { key: "Cancelled", whenLabel: "ยกเลิกงาน", toDesc: "Import เจ้าของงาน, Designer ของงาน", ccDesc: "–", todo: "แจ้งให้ทราบ · หยุดดำเนินการ", defaultMode: "ทันที" },
];

export const REMIND_DEFS: Array<[string, string, string, string, string, string]> = [
  ["r1", "ใกล้ครบ SLA", "เหลือ 1 วันทำงานก่อนครบ SLA ของขั้น", "ผู้รับผิดชอบขั้นนั้น", "–", "สรุปรายวัน 08:30"],
  ["r2", "เกิน SLA", "วันแรกที่เกิน SLA ของขั้น", "ผู้รับผิดชอบขั้นนั้น", "หัวหน้าทีม", "ทันที + สรุปรายวัน"],
  ["r3", "เกิน SLA นาน", "เกิน SLA ตั้งแต่ 3 วันทำงานขึ้นไป", "ผู้รับผิดชอบขั้นนั้น", "หัวหน้าทีม + Director", "สรุปรายวัน 08:30"],
  ["r4", "สรุปงานรายวัน", "ทุกวันทำงาน 08:30", "ทุกคนที่มีงานรอ", "–", "วันละ 1 ฉบับ"],
];
