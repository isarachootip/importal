import { NextResponse } from "next/server";
import {
  buildSkuFormXlsx,
  generateDemoSkuList,
  parseSkuCsvText,
  parseSkuXlsxBuffer,
} from "@/lib/domain/sku-parser";
import { sanitizeFileName, putObjectBuffer } from "@/lib/storage/s3";
import { todayBangkok } from "@/lib/domain/working-days";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pi = sanitizeFileName(url.searchParams.get("pi") ?? "PI");
    const buf = await buildSkuFormXlsx();
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="SKU_Form_${pi}.xlsx"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const today = todayBangkok();

    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { mode?: string; pi?: string; items?: number; piDate?: string };
      const pi = body.pi ?? "PI-DEMO";
      const items = Number(body.items ?? 12);
      const piDate = body.piDate ?? today;
      const parsed = generateDemoSkuList(pi, items, piDate, today);
      return jsonOk({ file: `SKU_${pi}.xlsx`, storageKey: null, ...parsed });
    }

    const form = await req.formData();
    const file = form.get("file");
    const piDate = String(form.get("piDate") ?? today);
    if (!(file instanceof File)) {
      throw new Error("กรุณาเลือกไฟล์ .xlsx หรือ .csv");
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    let parsed: { list: Array<{ sku: string; created: string; gr: string | null }>; warn: string[] };

    if (/\.csv$/i.test(file.name)) {
      parsed = parseSkuCsvText(buffer.toString("utf8"), piDate, today);
    } else if (/\.xlsx$/i.test(file.name)) {
      parsed = await parseSkuXlsxBuffer(buffer, piDate, today);
    } else {
      throw new Error("รองรับไฟล์ .xlsx หรือ .csv · กรุณาใช้แบบฟอร์มที่ดาวน์โหลด");
    }

    let storageKey: string | null = `sku/${Date.now()}_${sanitizeFileName(file.name)}`;
    try {
      await putObjectBuffer(storageKey, buffer, file.type || "application/octet-stream");
    } catch {
      storageKey = null;
    }

    return jsonOk({ file: file.name, storageKey, ...parsed });
  } catch (err) {
    return handleApiError(err);
  }
}
