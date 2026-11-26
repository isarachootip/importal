"use client";

import React, { useMemo } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { BRANDS, DESIGNER_NAMES, IMPORTER_NAMES, sdeptLabel } from "@/lib/domain/aw-constants";
import { TH_MONTHS_FULL } from "@/lib/domain/working-days";
import { SearchableSelect } from "./searchable-select";

export function GlobalFilterBar() {
  const { jobs, filter, setFilter, resetFilter } = useTracker();

  const years = useMemo(() => [...new Set(jobs.map((j) => j.piDate.slice(0, 4)))].sort().reverse(), [jobs]);
  const sdepts = useMemo(() => {
    const codes = [...new Set(jobs.flatMap((j) => j.sdepts))].sort((a, b) => a - b);
    return codes.map((c): [number, string] => [c, sdeptLabel(c)]);
  }, [jobs]);
  const monthOpts = useMemo(
    () => TH_MONTHS_FULL.map((m, idx): [number, string] => [idx + 1, m]),
    []
  );

  return (
    <div className="card filters" style={{ padding: "14px 16px" }}>
      <label className="fl">
        Year
        <SearchableSelect
          ariaLabel="Year"
          value={filter.year}
          options={years}
          allLabel="ทั้งหมด"
          onChange={(v) => setFilter((prev) => ({ ...prev, year: v }))}
        />
      </label>
      <label className="fl">
        Month
        <SearchableSelect
          ariaLabel="Month"
          value={filter.month}
          options={monthOpts}
          allLabel="ทั้งหมด"
          onChange={(v) => setFilter((prev) => ({ ...prev, month: v }))}
        />
      </label>
      <label className="fl">
        Sdept
        <SearchableSelect
          ariaLabel="Sdept"
          value={filter.sdept}
          options={sdepts}
          allLabel="ทั้งหมด"
          onChange={(v) => setFilter((prev) => ({ ...prev, sdept: v }))}
        />
      </label>
      <label className="fl">
        Import Name
        <SearchableSelect
          ariaLabel="Import Name"
          value={filter.importer}
          options={IMPORTER_NAMES}
          allLabel="ทั้งหมด"
          onChange={(v) => setFilter((prev) => ({ ...prev, importer: v }))}
        />
      </label>
      <label className="fl">
        Designer&apos;s Name
        <SearchableSelect
          ariaLabel="Designer's Name"
          value={filter.designer}
          options={DESIGNER_NAMES}
          allLabel="ทั้งหมด"
          onChange={(v) => setFilter((prev) => ({ ...prev, designer: v }))}
        />
      </label>
      <label className="fl">
        House Brand Name
        <SearchableSelect
          ariaLabel="House Brand Name"
          value={filter.brand}
          options={BRANDS}
          allLabel="ทั้งหมด"
          onChange={(v) => setFilter((prev) => ({ ...prev, brand: v }))}
        />
      </label>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <button type="button" className="btn sm" onClick={resetFilter}>
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  );
}
