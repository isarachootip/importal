"use client";

import React from "react";
import type { JobRecord, JobSkuEntry } from "@/lib/domain/job-types";
import { curEntry, dateOfMark, slaOf, totalSla } from "@/lib/domain/sla-engine";
import { addWorkingDays, diffWorkingDays, fmtThaiDate } from "@/lib/domain/working-days";

export function SkuListTable({ list, showGr }: { list: JobSkuEntry[]; showGr: boolean }) {
  return (
    <div className="scroll" style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
      <table className="tbl sm">
        <thead>
          <tr><th>#</th><th>SKU</th><th>วันที่สร้าง SKU (MMS)</th>{showGr && <th>Goods Received (API)</th>}</tr>
        </thead>
        <tbody>
          {list.map((x, i) => (
            <tr key={`${x.sku}-${i}`}>
              <td className="hint">{i + 1}</td>
              <td>{x.sku}</td>
              <td>{fmtThaiDate(x.created)}</td>
              {showGr && (
                <td>{x.gr ? <span className="chip ok">รับแล้ว {fmtThaiDate(x.gr)}</span> : <span className="chip neu">รอรับ</span>}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductionAndGrStatusView({
  job,
  mode,
  holidays,
  busy,
  onTriggerGrSync,
}: {
  job: JobRecord;
  mode: "In Production" | "Goods Received";
  holidays: ReadonlySet<string>;
  busy: boolean;
  onTriggerGrSync: () => void;
}) {
  if (mode === "Goods Received") {
    const grDate = dateOfMark(job, "gr");
    const used = diffWorkingDays(job.piDate, grDate, holidays);
    const tot = totalSla(job);
    const receivedSkus = job.skus.filter((x) => Boolean(x.gr)).length;
    return (
      <>
        <div className="info">
          สินค้าเข้าแล้วเมื่อ <b>{fmtThaiDate(grDate)}</b> (API: PI + SKU) · ใช้เวลารวม {used} วัน จาก SLA {tot} วัน →{" "}
          {used <= tot ? <b style={{ color: "var(--blue-d)" }}>On-time</b> : <b style={{ color: "var(--org-d)" }}>Delay</b>}
          <div className="hint" style={{ marginTop: 4 }}>
            วันที่สินค้าเข้า = วันที่ SKU แรกเข้า{job.skus.length > 0 ? ` · รับแล้ว ${receivedSkus}/${job.skus.length} SKU` : ""}
          </div>
        </div>
        {job.skus.length > 0 && <div style={{ marginTop: 12 }}><SkuListTable list={job.skus} showGr /></div>}
        {job.skus.some((x) => !x.gr) && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn sm" disabled={busy} onClick={onTriggerGrSync}>
              จำลองเรียก API รับ SKU ที่เหลือ (Demo)
            </button>
          </div>
        )}
      </>
    );
  }

  const eta = addWorkingDays(curEntry(job).d, slaOf(job) ?? 75, holidays);
  const received = job.skus.filter((x) => Boolean(x.gr)).length;
  return (
    <>
      <div className="info">
        ส่ง AW ให้โรงงานแล้ว · Leadtime {job.leadtime ?? 55} วัน + Inspection/Logistic 20 วัน{job.poNumber ? ` · PO: ${job.poNumber}` : ""}
        <br />คาดว่าสินค้าเข้า <b>{fmtThaiDate(eta)}</b> · SKU {job.skus.length} รายการ · <b>รับแล้ว {received}/{job.skus.length}</b>
      </div>
      <div className="hint" style={{ margin: "12px 0" }}>
        ขั้นนี้ไม่มีใครต้องกด ระบบเรียก API ดึงสถานะ Goods Received ด้วยเลข PI + SKU · วันที่สินค้าเข้าของ PI = วันที่ SKU แรกเข้า
      </div>
      {job.skus.length > 0 && <SkuListTable list={job.skus} showGr />}
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn" disabled={busy} onClick={onTriggerGrSync}>
          จำลองเรียก API Goods Received (Demo)
        </button>
      </div>
    </>
  );
}
