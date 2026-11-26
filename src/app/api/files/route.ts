import { putObjectBuffer, sanitizeFileName } from "@/lib/storage/s3";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const rawFiles = form.getAll("files");
    const uploaded: Array<{
      name: string;
      storageKey: string | null;
      mimeType: string;
      sizeBytes: number;
    }> = [];

    for (const item of rawFiles) {
      if (!(item instanceof File)) continue;
      const buf = Buffer.from(await item.arrayBuffer());
      const safeName = sanitizeFileName(item.name);
      const mimeType = item.type || "application/octet-stream";
      let storageKey: string | null = `aw/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;
      try {
        await putObjectBuffer(storageKey, buf, mimeType);
      } catch (err) {
        console.warn("[AW Storage] MinIO upload skipped, recording metadata:", err);
        storageKey = null;
      }
      uploaded.push({
        name: item.name,
        storageKey,
        mimeType,
        sizeBytes: buf.length,
      });
    }

    return jsonOk({ uploaded });
  } catch (err) {
    return handleApiError(err);
  }
}
