"use client";

import React from "react";
import { StatusPill } from "@/components/ui/status-badges";
import { PATTERNS, ROLE_TH, SUB_MAP, type SubStatus } from "@/lib/domain/aw-constants";

const LANES = ["System", "Import", "MDSG", "Designer", "Photographer", "Factory"] as const;

type SwimCell = [string, string, string?, string?];
const SWIMLANE_ROWS: Array<[string, Record<number, SwimCell>]> = [
  ["Open", { 1: ["แจ้งงานออกแบบ (Create Job)", "Old SKU 2 วัน / New SKU 7 วัน"] }],
  ["", { 3: ["ตรวจข้อมูล & Brief (Y/N)", "2 วัน"] }],
  ["", { 3: ["มีรูปสินค้าจากโรงงาน?", "", "dec", "No → ส่งถ่ายรูป"], 4: ["ถ่ายรูปสินค้า", "+7 วัน"] }],
  ["", { 1: ["ส่งข้อมูล / รูปเพิ่มเติม", "2 วัน"], 3: ["ข้อมูลครบ?", "", "dec", "No → ส่งกลับ Import"] }],
  ["", { 3: ["Confirm Info Complete", "เริ่มนับ Designer SLA"] }],
  ["Draft AW", { 3: ["ส่ง Draft", "7 วัน"] }],
  ["", { 1: ["Import ตรวจ Draft · Pass / Fail", "รวม 2 วัน (Import + MDSG)", "", "ส่งต่อ MDSG ทุกกรณี"] }],
  ["", { 2: ["MDSG ตรวจ Draft · Buyer → GM → VP (+EVP ถ้า New Pattern) · Pass / Fail", ""] }],
  ["", { 2: ["รวมผล 2 ทีม: Pass ทั้งคู่?", "", "dec", "No → รวมคอมเมนต์ส่ง Designer"], 3: ["แก้ไข Draft (ครั้งเดียว)", "3 วัน"] }],
  ["", { 3: ["Present AW", "1 วัน"] }],
  ["", { 2: ["EVP Approve?", "1 วัน", "dec", "No → แก้ไข"], 3: ["แก้ไข Draft (EVP)", "1 วัน"] }],
  ["Final AW", { 3: ["Submit Final AW (.ai / .pdf)", "1 วัน"] }],
  ["Production", { 1: ["ส่ง Final AW ให้โรงงาน + ใส่ Leadtime, PO & Upload SKU number", "1 วัน"] }],
  ["", { 5: ["ผลิต / ขนส่ง", "Leadtime + 20 วัน"] }],
  ["Goods Received", { 0: ["Auto Sync PO · Goods received date", ""] }],
];

export function WorkflowView() {
  return (
    <>
      <div className="card">
        <h2>Workflow การทำงาน (Swimlane)</h2>
        <div className="hint" style={{ marginBottom: 14 }}>
          ป้ายสีเขียว = SLA ของขั้นนั้น · กรอบขาว = จุดตัดสินใจ
        </div>
        <div className="scroll">
          <div className="lane" style={{ borderLeft: "1px solid var(--line)", borderTop: "1px solid var(--line)" }}>
            <div className="hd">Status</div>
            {LANES.map((l) => (
              <div key={l} className="hd">{l}</div>
            ))}
            {SWIMLANE_ROWS.map(([st, cells], rowIdx) => (
              <React.Fragment key={rowIdx}>
                <div className="st">{st}</div>
                {LANES.map((_, colIdx) => {
                  const c = cells[colIdx];
                  return (
                    <div key={colIdx}>
                      {c && (
                        <div className={`box ${c[2] ?? ""}`}>
                          {c[0]}
                          {c[1] && (
                            <>
                              <br />
                              <span className="sla">{c[1]}</span>
                            </>
                          )}
                          {c[3] && <span className="no">{c[3]}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>SLA ตาม Type of Pattern</h2>
        <div className="hint" style={{ marginBottom: 12 }}>
          ใช้คำนวณกำหนดสินค้าเข้าและ On-time / Delay
        </div>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Case</th>
                <th>Description</th>
                <th className="r">Info<div style={{ fontWeight: 400, fontSize: 11 }}>เตรียมข้อมูล</div></th>
                <th className="r">Confirm Info<div style={{ fontWeight: 400, fontSize: 11 }}>ตรวจ &amp; Brief</div></th>
                <th className="r">AW</th>
                <th className="r">Production</th>
                <th className="r">Inspection + Logistic</th>
                <th className="r">รวม (วัน)</th>
              </tr>
            </thead>
            <tbody>
              {PATTERNS.map((p) => (
                <tr key={p.id}>
                  <td className="hint">{p.grp}</td>
                  <td><b>{p.name}</b></td>
                  <td className="hint">{p.desc}</td>
                  <td className="r">{p.info}</td>
                  <td className="r">{p.brief}</td>
                  <td className="r">{p.aw}</td>
                  <td className="r">{p.prod}</td>
                  <td className="r">{p.log}</td>
                  <td className="r"><b>{p.total}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Status &amp; Sub Status</h2>
        <div className="scroll" style={{ marginTop: 10 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Status</th>
                <th>Sub Status</th>
                <th>ผู้รับผิดชอบ</th>
                <th>สิ่งที่ทำ</th>
                <th className="r">SLA (วัน)</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(SUB_MAP) as Array<[SubStatus, (typeof SUB_MAP)[SubStatus]]>).map(([k, v]) => (
                <tr key={k}>
                  <td><StatusPill status={v.st} /></td>
                  <td><b>{k}</b></td>
                  <td>{v.roles.map((r) => ROLE_TH[r] ?? r).join(" / ") || "–"}</td>
                  <td>{v.label}</td>
                  <td className="r">{v.sla != null ? v.sla : k === "In Production" ? "Leadtime + 20" : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
