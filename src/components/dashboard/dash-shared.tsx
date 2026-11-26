"use client";

import React from "react";

export function pctText(a: number, b: number): string {
  return b ? `${Math.round((a / b) * 100)}%` : "–";
}

export function SectionHeading({
  num,
  title,
  sub,
}: {
  num: number;
  title: string;
  sub: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        flexWrap: "wrap",
        margin: "28px 0 12px",
        paddingBottom: 8,
        borderBottom: "2px solid var(--navy)",
      }}
    >
      <span
        style={{
          background: "var(--navy)",
          color: "#fff",
          borderRadius: 6,
          padding: "2px 10px",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        ส่วนที่ {num}
      </span>
      <h2 style={{ margin: 0, fontSize: 20, color: "var(--navy)" }}>{title}</h2>
      <span className="hint">{sub}</span>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="card kpi">
      <div className="l">{label}</div>
      <div className="v" style={{ color }}>{value}</div>
      <div className="s">{sub}</div>
    </div>
  );
}

export function PctBar({ on, total }: { on: number; total: number }) {
  if (!total) return <span className="hint">–</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="bar" style={{ flex: 1, height: 10, background: "#F6C8A8" }}>
        <div style={{ width: `${(on / total) * 100}%`, background: "var(--blue)" }} />
      </div>
      <b style={{ width: 38, textAlign: "right" }}>{pctText(on, total)}</b>
    </div>
  );
}
