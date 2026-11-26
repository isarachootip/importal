import { describe, expect, it } from "vitest";
import { computeDesignerDashboard } from "@/lib/domain/dashboard-designer";
import { computeImprovementDashboard } from "@/lib/domain/dashboard-improvement";
import { computeOverallDashboard } from "@/lib/domain/dashboard-overall";
import { generateDemoJobs } from "@/lib/domain/demo-generator";
import { HOL_DEFAULT } from "@/lib/domain/working-days";

const HOL = new Set<string>(HOL_DEFAULT);

describe("Dashboard Sections 1, 2, and 3 Analytics", () => {
  const jobs = generateDemoJobs("2026-11-24", HOL);

  it("computes Section 1 overall KPIs, monthly rows, pending breakdown, and license table", () => {
    const res = computeOverallDashboard(jobs, "2026-11-24", HOL);
    expect(res.totalPi).toBe(jobs.length);
    expect(res.statusRows.reduce((s, r) => s + r.n, 0)).toBe(jobs.length);
    expect(res.monthlyRows.length).toBeGreaterThan(0);
    expect(res.licenseRows).toHaveLength(3);
  });

  it("computes Section 2 designer & photographer workload, performance, and unsubmitted Final AW list", () => {
    const res = computeDesignerDashboard(jobs, "2026-11-24", HOL);
    expect(res.workloadRows.length).toBeGreaterThan(0);
    expect(res.patternRows).toHaveLength(4);
    expect(res.unsubmittedFinalAw.every((r) => r.sub !== "Goods Received" && r.sub !== "Cancelled")).toBe(true);
  });

  it("computes Section 3 improvement phases and department step benchmarks", () => {
    const res = computeImprovementDashboard(jobs, "2026-11-24", HOL);
    expect(res.phases.length).toBeGreaterThan(0);
    expect(res.departments.length).toBeGreaterThan(0);
  });
});
