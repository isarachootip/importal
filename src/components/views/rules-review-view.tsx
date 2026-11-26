"use client";

import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { StatusPill } from "@/components/ui/status-badges";
import { PATTERNS, ROLE_TH, SUB_MAP, type SubStatus } from "@/lib/domain/aw-constants";
import { RULE_KPI, RULE_Q, RULE_STEPS } from "@/lib/domain/rules-metadata";
import { HolidaysEditorCard } from "./holidays-editor-card";
import { ReviewInputCells } from "./review-input-cells";

export function RulesReviewView() {
  const { reviews, today, showToast } = useTracker();
  const reviewedCount = Object.values(reviews).filter((x) => Boolean(x.st)).length;

  function exportReviewCsv() {
    const rows: string[][] = [["หมวด", "รายการ", "ค่าปัจจุบัน", "ผล Review", "ข้อเสนอ / ความเห็น"]];
    RULE_STEPS.forEach((r) => {
      const v = reviews[`s:${r.key}`] ?? { st: "", note: "" };
      const sla = r.slaOverride != null ? String(r.slaOverride) : String(SUB_MAP[r.key as SubStatus]?.sla ?? "");
      rows.push(["มาตรฐานรายขั้น", r.title, sla, v.st, v.note]);
    });
    PATTERNS.forEach((p) => {
      const v = reviews[`p:${p.id}`] ?? { st: "", note: "" };
      rows.push(["SLA ตาม Pattern", p.name, `เตรียมข้อมูล ${p.info} / ตรวจ & Brief ${p.brief} / AW ${p.aw} / Prod ${p.prod} / Log ${p.log} = ${p.total}`, v.st, v.note]);
    });
    RULE_KPI.forEach((k) => {
      const v = reviews[`k:${k.name}`] ?? { st: "", note: "" };
      rows.push(["ตัวชี้วัด", k.name, k.compareTo, v.st, v.note]);
    });
    RULE_Q.forEach((q) => {
      const v = reviews[q[0]] ?? { st: "", note: "" };
      rows.push(["ข้อสรุป", q[1], q[2], v.st, v.note]);
    });

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `AW_Metrics_Review_${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    showToast("Export ผล Review แล้ว (เปิดด้วย Excel ได้)");
  }

  return (
    <>
      <div className="card" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>เกณฑ์การวัดที่ใช้ใน Dashboard</h2>
          <div className="hint" style={{ marginTop: 4 }}>
            ให้ทีมเลือกผล Review และใส่ค่าที่เสนอในแต่ละแถว (บันทึกลงฐานข้อมูลอัตโนมัติ) แล้วกด Export ส่งกลับ · Review แล้ว <b>{reviewedCount}</b> รายการ
          </div>
        </div>
        <button type="button" className="btn pri" onClick={exportReviewCsv}>Export ผล Review (Excel)</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>1. มาตรฐานรายขั้นตอน</h2>
        <div className="hint" style={{ marginBottom: 12 }}>ใช้วัด &quot;เกิน SLA ขั้นปัจจุบัน&quot; และส่วน Improvement · <b>นับเป็นวันทำงาน</b> ไม่รวมเสาร์-อาทิตย์และวันหยุดประจำปี</div>
        <div className="scroll">
          <table className="tbl sm">
            <thead><tr><th>Status</th><th>ขั้นตอน</th><th>ผู้รับผิดชอบ</th><th>เริ่มนับเมื่อ</th><th>หยุดนับเมื่อ</th><th className="r">มาตรฐาน (วัน)</th><th>ที่มา</th><th>สถานะ</th><th>ผล Review</th><th>ข้อเสนอ / ความเห็น</th></tr></thead>
            <tbody>
              {RULE_STEPS.map((r) => (
                <tr key={r.key}>
                  <td><StatusPill status={r.status} /></td>
                  <td style={{ whiteSpace: "nowrap" }}><b>{r.title}</b><div className="hint" style={{ fontSize: 11 }}>{r.key === "_create" ? "Create Job" : r.key}</div></td>
                  <td>{ROLE_TH[r.role] ?? r.role}</td><td>{r.startWhen}</td><td>{r.stopWhen}</td>
                  <td className="r" style={{ whiteSpace: "nowrap" }}><b>{r.slaOverride != null ? r.slaOverride : SUB_MAP[r.key as SubStatus]?.sla}</b></td>
                  <td className="hint">{r.source}{r.extraNote && <div style={{ color: "var(--org-d)" }}>{r.extraNote}</div>}</td>
                  <td><span className={`chip ${r.state === "assume" ? "bad" : "ok"}`}>{r.state === "assume" ? "รอยืนยัน" : r.state === "done" ? "ยืนยันแล้ว" : "ตามไฟล์"}</span></td>
                  <ReviewInputCells itemKey={`s:${r.key}`} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>2. SLA ตาม Type of Pattern</h2>
        <div className="hint" style={{ marginBottom: 12 }}>ใช้คำนวณกำหนดส่ง Final AW, กำหนดสินค้าเข้า และ On-time Overall</div>
        <div className="scroll">
          <table className="tbl sm">
            <thead><tr><th>Pattern</th><th>Case</th><th className="r">Info</th><th className="r">Confirm Info</th><th className="r">AW</th><th className="r">Production</th><th className="r">Inspection + Logistic</th><th className="r">รวม</th><th>ผล Review</th><th>ข้อเสนอ / ความเห็น</th></tr></thead>
            <tbody>
              {PATTERNS.map((p) => (
                <tr key={p.id}>
                  <td className="hint">{p.grp}</td>
                  <td style={{ whiteSpace: "nowrap" }}><b>{p.name}</b><div className="hint" style={{ fontSize: 11 }}>{p.desc}</div></td>
                  <td className="r">{p.info}</td><td className="r">{p.brief}</td><td className="r">{p.aw}</td><td className="r">{p.prod}</td><td className="r">{p.log}</td><td className="r"><b>{p.total}</b></td>
                  <ReviewInputCells itemKey={`p:${p.id}`} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--soft)", borderRadius: 8, fontSize: 13, lineHeight: 1.8 }}>
          <b style={{ color: "var(--navy)" }}>กติกาปรับ SLA</b><br />
          1) เกิน 30 SKUs/PI → +7 วัน ทุกๆ 30 SKUs (บวกในช่วง AW) · 2) ถ่ายรูปสินค้าใหม่ → +7 วัน (บวกในช่วง Info) · 3) ขอ TISI (มอก.) → +90 วัน · 4) ขอ อย. → +60 วัน (บวกในช่วง Production) · 5) New Brand / New Logo ต้องอนุมัติก่อนขออนุมัติ PI · 6) กระเบื้องจากอินเดีย / จีน บวกเวลา Inspection + Logistic
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>3. นิยามตัวชี้วัด</h2>
        <div className="scroll" style={{ marginTop: 10 }}>
          <table className="tbl sm">
            <thead><tr><th>ตัวชี้วัด</th><th>เริ่มนับ</th><th>หยุดนับ</th><th>เทียบกับ</th><th>เงื่อนไข / หมายเหตุ</th><th>ผล Review</th><th>ข้อเสนอ / ความเห็น</th></tr></thead>
            <tbody>
              {RULE_KPI.map((k) => (
                <tr key={k.name}><td style={{ whiteSpace: "nowrap" }}><b>{k.name}</b></td><td>{k.start}</td><td>{k.stop}</td><td>{k.compareTo}</td><td className="hint">{k.note}</td><ReviewInputCells itemKey={`k:${k.name}`} /></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>4. ข้อสรุปจากการ Review</h2>
        <div className="scroll" style={{ marginTop: 10 }}>
          <table className="tbl sm">
            <thead><tr><th>#</th><th>คำถาม</th><th>ข้อสรุป</th><th>ผล Review</th><th>ความเห็นเพิ่มเติม</th></tr></thead>
            <tbody>
              {RULE_Q.map((q, i) => (
                <tr key={q[0]}><td className="hint">{i + 1}</td><td>{q[1]}</td><td><span className="chip ok" style={{ whiteSpace: "normal" }}>{q[2]}</span></td><ReviewInputCells itemKey={q[0]} /></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HolidaysEditorCard />
    </>
  );
}
