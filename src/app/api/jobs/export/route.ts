import { NextResponse } from "next/server";
import { sdeptLabel } from "@/lib/domain/aw-constants";
import { buildJobsReportXlsx } from "@/lib/domain/excel-exporter";
import { curStatus, isOverdue } from "@/lib/domain/sla-engine";
import { TH_MONTHS_FULL, todayBangkok } from "@/lib/domain/working-days";
import { handleApiError } from "@/lib/services/api-helpers";
import { fetchHolidaySet, listAllJobs } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year") ?? "";
    const month = url.searchParams.get("month") ?? "";
    const sdept = url.searchParams.get("sdept") ?? "";
    const importer = url.searchParams.get("importer") ?? "";
    const designer = url.searchParams.get("designer") ?? "";
    const brand = url.searchParams.get("brand") ?? "";
    const tab = url.searchParams.get("tab") ?? "";
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    const [allJobs, holidays] = await Promise.all([listAllJobs(), fetchHolidaySet()]);
    const today = todayBangkok();

    let filtered = allJobs.filter(
      (j) =>
        (!year || j.piDate.slice(0, 4) === year) &&
        (!month || Number(j.piDate.slice(5, 7)) === Number(month)) &&
        (!sdept || j.sdepts.some((x) => String(x) === sdept)) &&
        (!importer || j.importer === importer) &&
        (!designer || j.designer === designer) &&
        (!brand || j.brand === brand)
    );

    if (tab === "overdue") filtered = filtered.filter((j) => isOverdue(j, today, holidays));
    else if (tab) filtered = filtered.filter((j) => curStatus(j) === tab);

    if (q) {
      filtered = filtered.filter((j) =>
        (j.pi + j.brand + j.supplier + j.importer + j.designer).toLowerCase().includes(q)
      );
    }

    const filterParts = [
      year && `ปี ${year}`,
      month && `เดือน ${TH_MONTHS_FULL[Number(month) - 1] ?? month}`,
      sdept && `Sdept ${sdeptLabel(Number(sdept))}`,
      importer && `Import: ${importer}`,
      designer && `Designer: ${designer}`,
      brand && `Brand: ${brand}`,
      tab && `แท็บ: ${tab === "overdue" ? "เกิน SLA" : tab}`,
      q && `ค้นหา: ${q}`,
    ].filter(Boolean);

    const buf = await buildJobsReportXlsx(
      filtered,
      today,
      holidays,
      filterParts.join(" · ") || "ทั้งหมด (ไม่มีตัวกรอง)"
    );

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="AW_Report_${today}.xlsx"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
