import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildJobsReportXlsx } from "@/lib/domain/excel-exporter";
import { generateDemoJobs } from "@/lib/domain/demo-generator";
import { buildSkuFormXlsx, parseSkuCsvText, parseSkuXlsxBuffer } from "@/lib/domain/sku-parser";
import { HOL_DEFAULT } from "@/lib/domain/working-days";

const HOL = new Set<string>(HOL_DEFAULT);

describe("SKU Excel Form/Parser & 5-Sheet Excel Exporter", () => {
  it("parses SKU CSV & XLSX reading only Column A, deduplicating, and warning on extra columns", async () => {
    const csv = "\uFEFFSKU,Extra\r\n100001,ignore\r\n100002,\r\n100001,\r\n";
    const parsed = parseSkuCsvText(csv, "2026-11-01", "2026-11-24");
    expect(parsed.list.map((x) => x.sku)).toEqual(["100001", "100002"]);
    expect(parsed.warn.some((w) => w.includes("Column อื่น"))).toBe(true);
    expect(parsed.warn.some((w) => w.includes("ซ้ำ"))).toBe(true);

    const formBuf = await buildSkuFormXlsx();
    const emptyParsed = await parseSkuXlsxBuffer(formBuf, "2026-11-01", "2026-11-24");
    expect(emptyParsed.list).toHaveLength(0);
  });

  it("generates a 5-sheet Excel report (.xlsx) with workbook XML and all required sheets", async () => {
    const jobs = generateDemoJobs("2026-11-24", HOL).slice(0, 15);
    const buf = await buildJobsReportXlsx(jobs, "2026-11-24", HOL, "ทั้งหมด (ไม่มีตัวกรอง)");
    const zip = await JSZip.loadAsync(buf);
    const wbXml = await zip.file("xl/workbook.xml")?.async("string");
    expect(wbXml).toContain("สรุป");
    expect(wbXml).toContain("รายการงาน");
    expect(wbXml).toContain("วันในแต่ละขั้น");
    expect(wbXml).toContain("ประวัติขั้นตอน");
    expect(wbXml).toContain("คำอธิบาย");
  });
});
