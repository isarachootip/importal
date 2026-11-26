"use client";

import React, { useEffect, useState } from "react";
import { useTracker } from "@/components/context/tracker-context";

export function HolidaysEditorCard() {
  const { holidays, updateHolidaysRemote, showToast } = useTracker();
  const [text, setText] = useState(() => [...holidays].sort().join("\n"));

  useEffect(() => {
    setText([...holidays].sort().join("\n"));
  }, [holidays]);

  async function handleSave() {
    const parsed = text
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
    try {
      await updateHolidaysRemote(parsed, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "บันทึกวันหยุดไม่สำเร็จ");
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>5. วันหยุดประจำปี (ใช้คำนวณวันทำงาน)</h2>
      <div className="hint" style={{ marginBottom: 10 }}>
        ค่าเริ่มต้น: วันหยุดธนาคารแห่งประเทศไทย ปี 2569–2570 · แก้เป็นปฏิทินวันหยุดของบริษัทได้ ใส่วันละบรรทัดรูปแบบ ปี-เดือน-วัน (ค.ศ.) แล้วกดบันทึก · ตอนนี้มี {holidays.length} วัน
      </div>
      <textarea
        rows={8}
        aria-label="รายการวันหยุด"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #C9D2DE",
          borderRadius: 8,
          padding: 10,
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
        <button
          type="button"
          className="btn sm"
          onClick={() => void updateHolidaysRemote([], true)}
        >
          คืนค่าเริ่มต้น
        </button>
        <button type="button" className="btn sm pri" onClick={() => void handleSave()}>
          บันทึกวันหยุด
        </button>
      </div>
    </div>
  );
}
