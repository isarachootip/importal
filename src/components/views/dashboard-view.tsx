"use client";

import React, { useMemo } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { DashDesignerPart1 } from "@/components/dashboard/dash-designer-part1";
import { DashDesignerPart2 } from "@/components/dashboard/dash-designer-part2";
import { DashImprovementSection } from "@/components/dashboard/dash-improvement-section";
import { DashOverallSection } from "@/components/dashboard/dash-overall-section";
import { GlobalFilterBar } from "@/components/ui/global-filter-bar";
import { computeDesignerDashboard } from "@/lib/domain/dashboard-designer";
import { computeImprovementDashboard } from "@/lib/domain/dashboard-improvement";
import { computeOverallDashboard } from "@/lib/domain/dashboard-overall";

export function DashboardView() {
  const { jobs, filter, dash2Filter, today, holidaySet } = useTracker();

  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (!filter.year || j.piDate.slice(0, 4) === filter.year) &&
          (!filter.month || Number(j.piDate.slice(5, 7)) === Number(filter.month)) &&
          (!filter.sdept || j.sdepts.some((x) => String(x) === filter.sdept)) &&
          (!filter.importer || j.importer === filter.importer) &&
          (!filter.designer || j.designer === filter.designer) &&
          (!filter.brand || j.brand === filter.brand)
      ),
    [jobs, filter]
  );

  const overallData = useMemo(
    () => computeOverallDashboard(filteredJobs, today, holidaySet),
    [filteredJobs, today, holidaySet]
  );

  const designerData = useMemo(
    () => computeDesignerDashboard(filteredJobs, today, holidaySet, dash2Filter),
    [filteredJobs, today, holidaySet, dash2Filter]
  );

  const improvementData = useMemo(
    () => computeImprovementDashboard(filteredJobs, today, holidaySet),
    [filteredJobs, today, holidaySet]
  );

  return (
    <>
      <GlobalFilterBar />
      <DashOverallSection data={overallData} />
      <DashDesignerPart1 data={designerData} />
      <DashDesignerPart2 data={designerData} />
      <DashImprovementSection
        phases={improvementData.phases}
        departments={improvementData.departments}
      />
    </>
  );
}
