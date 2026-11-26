import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getObjectBuffer, sanitizeFileName } from "@/lib/storage/s3";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const fileRow = await prisma.jobFile.findUnique({ where: { id } });
    if (!fileRow) return jsonOk({ error: "ไม่พบไฟล์" }, 404);

    if (fileRow.isLink) {
      return NextResponse.redirect(fileRow.fileName);
    }

    if (fileRow.storageKey) {
      const { body, contentType } = await getObjectBuffer(fileRow.storageKey);
      return new NextResponse(new Uint8Array(body), {
        status: 200,
        headers: {
          "Content-Type": fileRow.mimeType ?? contentType,
          "Content-Disposition": `attachment; filename="${sanitizeFileName(fileRow.fileName)}"`,
        },
      });
    }

    const demoPlaceholder = `AW Packaging Tracker Demo File\nFile: ${fileRow.fileName}\nUploaded Date: ${fileRow.uploadedDate}\nRole: ${fileRow.uploadedByRole}\n`;
    return new NextResponse(demoPlaceholder, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFileName(fileRow.fileName)}.txt"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
