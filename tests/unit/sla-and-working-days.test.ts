import { describe, expect, it } from "vitest";
import type { JobRecord } from "@/lib/domain/job-types";
import {
  awDeltaDays,
  awDueDays,
  dayInStage,
  isOverdue,
  slaAdjustment,
  slaOf,
  stageStart,
  totalSla,
} from "@/lib/domain/sla-engine";
import { addWorkingDays, diffWorkingDays, HOL_DEFAULT } from "@/lib/domain/working-days";

const HOL = new Set<string>(HOL_DEFAULT);

function makeJob(overrides: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "J1",
    jobCode: "J1001",
    pi: "PI-2611-001",
    piDate: "2026-11-02",
    bu: "TWD",
    supplier: "Supplier A (CN)",
    brand: "Kassa",
    pattern: 3,
    sdept: 102,
    sdepts: [102],
    folder: "https://drive.example.com/PI-2611-001",
    items: 12,
    license: "ไม่มี",
    packages: ["Color Box"],
    importer: "คุณหมู",
    designer: "คุณพีท",
    brief: "Y",
    photo: false,
    history: [{ sub: "Info Checking", d: "2026-11-03", by: "import", act: "Create Job", note: "", mark: "create" }],
    edits: [],
    files: [],
    skus: [],
    ...overrides,
  };
}

describe("Working days & SLA engine", () => {
  it("skips weekends and holidays when adding and diffing working days", () => {
    // 2026-04-10 is Friday; 2026-04-13..15 are Songkran holidays
    expect(addWorkingDays("2026-04-10", 1, HOL)).toBe("2026-04-16");
    expect(diffWorkingDays("2026-04-10", "2026-04-16", HOL)).toBe(1);
    expect(diffWorkingDays("2026-04-16", "2026-04-10", HOL)).toBe(-1);
  });

  it("calculates pattern total SLA and extra adjustments accurately", () => {
    const base = makeJob({ pattern: 3, items: 30, photo: false, license: "ไม่มี" });
    expect(slaAdjustment(base)).toBe(0);
    expect(totalSla(base)).toBe(99);

    const adjusted = makeJob({ pattern: 5, items: 61, photo: true, license: "TISI (มอก.)" });
    // >30 SKUs: ceil(61/30)-1 = 2 -> +14 days; photo -> +7; TISI -> +90 => +111 on 109 = 220
    expect(slaAdjustment(adjusted)).toBe(111);
    expect(totalSla(adjusted)).toBe(220);
  });

  it("combines Import Review + MDSG Review into a shared 2-day SLA window", () => {
    const job = makeJob({
      history: [
        { sub: "Info Checking", d: "2026-11-02", by: "import", act: "Create", note: "", mark: "create" },
        { sub: "Drafting", d: "2026-11-04", by: "designer", act: "Info Complete", note: "", mark: "info" },
        { sub: "Import Review", d: "2026-11-10", by: "designer", act: "Draft 1", note: "" },
        { sub: "MDSG Review", d: "2026-11-12", by: "import", act: "Import: Pass → ส่งให้ MDSG ตรวจ", note: "" },
      ],
    });
    expect(stageStart(job)).toBe("2026-11-10");
    expect(slaOf(job)).toBe(2);
    expect(dayInStage(job, "2026-11-13", HOL)).toBe(3);
    expect(isOverdue(job, "2026-11-13", HOL)).toBe(true);
  });

  it("computes Final AW due days excluding TISI/FDA license days", () => {
    const job = makeJob({ pattern: 4, items: 35, photo: true, license: "อย." });
    // Pattern 4: info 2 + brief 2 + photo 7 + aw 25 + items(>30 => +7) = 43 (FDA +60 NOT added to AW due)
    expect(awDueDays(job)).toBe(43);
    const dueIso = addWorkingDays(job.piDate, 43, HOL);
    expect(awDeltaDays(job, dueIso, HOL)).toBe(0);
  });
});
