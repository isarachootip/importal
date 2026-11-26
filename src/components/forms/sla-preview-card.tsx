"use client";

import React from "react";
import { PATTERNS } from "@/lib/domain/aw-constants";
import { extraItemDays, licenseDays } from "@/lib/domain/sla-engine";
import { addWorkingDays, fmtThaiDate } from "@/lib/domain/working-days";

export function SlaPreviewCard({
  patternId,
  items,
  license,
  piDate,
  holidays,
}: {
  patternId: number;
  items: number;
  license: string;
  piDate: string;
  holidays: ReadonlySet<string>;
}) {
  const p = PATTERNS.find((x) => x.id === patternId) ?? PATTERNS[1]!;
  const extra = extraItemDays(items);
  const ld = licenseDays(license);
  const total = p.total + extra + ld;
  const dueDate = addWorkingDays(piDate, total, holidays);

  const row = (label: string, value: string) => (
    <div
      key={label}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #EDF0F4",
        fontSize: 13,
      }}
    >
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );

  return (
    <div className="card" style={{ position: "sticky", top: 90 }}>
      <h2>SLA ของงานนี้</h2>
      <div className="hint" style={{ marginBottom: 10 }}>
        {p.grp} · {p.desc}
      </div>
      {row("เตรียมข้อมูล / แจ้งงาน", `${p.info} วัน`)}
      {row("ตรวจข้อมูล & Brief", `${p.brief} วัน`)}
      {row("AW (ออกแบบ)", `${p.aw} วัน`)}
      {row("Production", `${p.prod} วัน`)}
      {row("Inspection + Logistic", `${p.log} วัน`)}
      {extra > 0 && row(`> 30 SKUs (${items} items)`, `+${extra} วัน`)}
      {ld > 0 && row(`ขอ ${license}`, `+${ld} วัน`)}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: 15 }}>
        <b>รวม</b>
        <b style={{ color: "var(--navy)" }}>{total} วันทำงาน</b>
      </div>
      <div className="hint">ไม่นับเสาร์-อาทิตย์และวันหยุดประจำปี</div>
      <div className="info" style={{ marginTop: 8 }}>
        สินค้าควรเข้าภายใน <b>{fmtThaiDate(dueDate)}</b>
        <br />
        <span className="hint">ถ้าต้องถ่ายรูปสินค้าใหม่ ระบบจะ +7 วันอัตโนมัติ</span>
      </div>
      {ld > 0 && (
        <div className="notice" style={{ marginTop: 10 }}>
          ขอ {license} · ระบบบวกเวลาเพิ่ม {ld} วันใน SLA รวม · ไม่กระทบ SLA ของ Designer
        </div>
      )}
    </div>
  );
}
