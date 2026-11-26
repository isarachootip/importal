import JSZip from "jszip";

export type XlsxCellValue =
  | string
  | number
  | null
  | undefined
  | { v?: string | number | null; d?: string; s?: number };

export interface XlsxSheetSpec {
  name: string;
  rows: XlsxCellValue[][];
  cols: number[];
  freeze?: [number, number];
  filter?: number;
  hts?: Record<number, number>;
}

function colRef(n: number): string {
  let s = "";
  let cur = n + 1;
  while (cur > 0) {
    const m = (cur - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    cur = Math.floor((cur - 1) / 26);
  }
  return s;
}

function excelSerial(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1) - Date.UTC(1899, 11, 30)) / 86400000;
}

function escXml(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function renderCell(v: XlsxCellValue, r: number, c: number): string {
  if (v == null || v === "") return "";
  let s = 0;
  let raw: string | number | null | undefined = undefined;
  if (typeof v === "object") {
    s = v.s ?? 0;
    if (v.d) {
      return `<c r="${colRef(c)}${r}" s="${v.s ?? 2}"><v>${excelSerial(v.d)}</v></c>`;
    }
    raw = v.v;
    if (raw == null || raw === "") {
      return s ? `<c r="${colRef(c)}${r}" s="${s}"/>` : "";
    }
  } else {
    raw = v;
  }
  if (typeof raw === "number") {
    return `<c r="${colRef(c)}${r}" s="${s || 3}"><v>${raw}</v></c>`;
  }
  return `<c r="${colRef(c)}${r}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${escXml(raw)}</t></is></c>`;
}

function renderSheetXml(sh: XlsxSheetSpec): string {
  const fz = sh.freeze
    ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${sh.freeze[1]}" ySplit="${sh.freeze[0]}" topLeftCell="${colRef(sh.freeze[1])}${sh.freeze[0] + 1}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>`
    : '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>';
  const cols = `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`;
  const rows = sh.rows
    .map((row, ri) => {
      const r = ri + 1;
      const ht = sh.hts?.[r];
      return `<row r="${r}"${ht ? ` ht="${ht}" customHeight="1"` : ""}>${row.map((v, ci) => renderCell(v, r, ci)).join("")}</row>`;
    })
    .join("");
  const af = sh.filter
    ? `<autoFilter ref="A${sh.filter}:${colRef(sh.cols.length - 1)}${Math.max(sh.rows.length, sh.filter + 1)}"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${fz}<sheetFormatPr defaultRowHeight="18"/>${cols}<sheetData>${rows}</sheetData>${af}</worksheet>`;
}

function renderStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="d mmm yy"/><numFmt numFmtId="165" formatCode="+0;-0;0"/></numFmts>
<fonts count="7"><font><sz val="11"/><name val="Tahoma"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font><font><b/><sz val="11"/><color rgb="FFC0392B"/><name val="Tahoma"/></font><font><b/><sz val="11"/><color rgb="FF1E8449"/><name val="Tahoma"/></font><font><b/><sz val="15"/><color rgb="FF1F3A5F"/><name val="Tahoma"/></font><font><i/><sz val="10"/><color rgb="FF6B7685"/><name val="Tahoma"/></font><font><b/><sz val="11"/><name val="Tahoma"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3A5F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2C2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EDF4"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD5DCE6"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="15">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="3" fontId="6" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="3" fontId="6" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

export async function buildXlsxWorkbookBuffer(sheets: XlsxSheetSpec[]): Promise<Buffer> {
  const x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const dn = sheets
    .map((s, i) =>
      s.filter
        ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escXml(s.name)}'!$A$${s.filter}:$${colRef(s.cols.length - 1)}$${Math.max(s.rows.length, s.filter + 1)}</definedName>`
        : ""
    )
    .join("");

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    x +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
  );
  zip.file(
    "_rels/.rels",
    x +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
  );
  zip.file(
    "xl/workbook.xml",
    x +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${escXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>${dn ? `<definedNames>${dn}</definedNames>` : ""}</workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    x +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  );
  zip.file("xl/styles.xml", renderStylesXml());
  sheets.forEach((s, i) => {
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, renderSheetXml(s));
  });

  return zip.generateAsync({ type: "nodebuffer" });
}
