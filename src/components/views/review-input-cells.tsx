"use client";

import React from "react";
import { useTracker } from "@/components/context/tracker-context";

const REVIEW_OPTIONS = ["เห็นด้วย", "ขอแก้ไข", "ต้องคุยเพิ่ม"] as const;

export function ReviewInputCells({ itemKey }: { itemKey: string }) {
  const { reviews, saveReviewRemote } = useTracker();
  const cur = reviews[itemKey] ?? { st: "", note: "" };

  return (
    <>
      <td style={{ whiteSpace: "nowrap" }}>
        <select
          aria-label="ผล Review"
          value={cur.st}
          onChange={(e) => void saveReviewRemote(itemKey, e.target.value, cur.note)}
          style={{ border: "1px solid #C9D2DE", borderRadius: 6, padding: "4px 6px", fontSize: 12 }}
        >
          <option value="">– รอ Review –</option>
          {REVIEW_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          aria-label="ข้อเสนอ"
          defaultValue={cur.note}
          placeholder="ค่าที่เสนอ / ความเห็น"
          onBlur={(e) => {
            if (e.target.value !== cur.note) {
              void saveReviewRemote(itemKey, cur.st, e.target.value);
            }
          }}
          style={{
            border: "1px solid #C9D2DE",
            borderRadius: 6,
            padding: "5px 8px",
            width: "100%",
            minWidth: 160,
            fontSize: 12,
          }}
        />
      </td>
    </>
  );
}
