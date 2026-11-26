import JSZip from "jszip";
import { hashString } from "./demo-generator";
import type { JobSkuEntry } from "./job-types";
import { addCalendarDays, diffWorkingDays, HOL_DEFAULT } from "./working-days";

const HOL_SET = new Set<string>(HOL_DEFAULT);

export function mmsCreatedDateForSku(piDate: string, today: string, sku: string): string {
  const span = Math.max(1, diffWorkingDays(piDate, today, HOL_SET) + 120);
  return addCalendarDays(piDate, (hashString(sku) % span) - 120);
}

export async function buildSkuFormXlsx(): Promise<Buffer> {
  const x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const zip = new JSZip();
  zip.file("[Content_Types].xml", x + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
  zip.file("_rels/.rels", x + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file("xl/workbook.xml", x + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="SKU" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file("xl/_rels/workbook.xml.rels", x + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  zip.file("xl/styles.xml", x + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
  zip.file("xl/worksheets/sheet1.xml", x + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="22" style="2" customWidth="1"/></cols><sheetData><row r="1"><c r="A1" t="inlineStr" s="1"><is><t>SKU</t></is></c></row></sheetData></worksheet>');
  return zip.generateAsync({ type: "nodebuffer" });
}

export function parseSkuRows(
  rows: string[][],
  piDate: string,
  today: string
): { list: JobSkuEntry[]; warn: string[] } {
  const list: JobSkuEntry[] = [];
  const warn: string[] = [];
  let extra = 0;
  let dup = 0;
  const seen = new Set<string>();

  rows.forEach((r, idx) => {
    const a = String(r[0] ?? "").trim();
    if (r.slice(1).some((v) => String(v ?? "").trim() !== "")) extra++;
    if (!a || (idx === 0 && /^sku/i.test(a))) return;
    if (seen.has(a)) {
      dup++;
      return;
    }
    seen.add(a);
    list.push({ sku: a, created: mmsCreatedDateForSku(piDate, today, a), gr: null });
  });

  if (extra > 0) warn.push(`มีข้อมูลใน Column อื่น ${extra} แถว · ระบบอ่านเฉพาะ Column A`);
  if (dup > 0) warn.push(`ตัด SKU ซ้ำ ${dup} รายการ`);
  return { list, warn };
}

export function parseSkuCsvText(
  csvText: string,
  piDate: string,
  today: string
): { list: JobSkuEntry[]; warn: string[] } {
  const rows = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.split(","));
  return parseSkuRows(rows, piDate, today);
}

export async function parseSkuXlsxBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  piDate: string,
  today: string
): Promise<{ list: JobSkuEntry[]; warn: string[] }> {
  const zip = await JSZip.loadAsync(buffer);
  const ssXml = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const ss = [...ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...(m[1] ?? "").matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1] ?? "").join("")
  );

  const sheetName = Object.keys(zip.files)
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort()[0];
  if (!sheetName) return { list: [], warn: [] };

  const xml = (await zip.file(sheetName)?.async("string")) ?? "";
  const rows: string[][] = [];

  for (const cMatch of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attrs = cMatch[1] ?? "";
    const inner = cMatch[2] ?? "";
    const refMatch = attrs.match(/\br="([A-Z]+)(\d+)"/);
    if (!refMatch) continue;
    let col = 0;
    for (const ch of refMatch[1] ?? "") col = col * 26 + ch.charCodeAt(0) - 64;
    const rowIdx = Number(refMatch[2]) - 1;
    const typeMatch = attrs.match(/\bt="([^"]+)"/);
    const tAttr = typeMatch?.[1] ?? "";
    const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
    let val = vMatch?.[1] ?? "";
    if (tAttr === "s") val = ss[Number(val)] ?? "";
    else if (tAttr === "inlineStr") {
      val = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1] ?? "").join("");
    }
    const row = rows[rowIdx] ?? [];
    row[col - 1] = val;
    rows[rowIdx] = row;
  }

  return parseSkuRows(Array.from(rows, (r) => r ?? []), piDate, today);
}

export function generateDemoSkuList(pi: string, items: number, piDate: string, today: string): { list: JobSkuEntry[]; warn: string[] } {
  const n = Math.min(items, 12);
  const rows: string[][] = [["SKU"]];
  for (let i = 0; i < n; i++) {
    rows.push([String(1000000 + (hashString(`${pi}${i}`) % 8999999))]);
  }
  return parseSkuRows(rows, piDate, today);
}
