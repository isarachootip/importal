import { NextResponse } from "next/server";
import { assertAnyRole } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/services/api-helpers";
import { getObjectBuffer } from "@/lib/storage/s3";

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; fileId: string }> }
) {
  try {
    const user = await getCurrentUser();
    assertAnyRole(user, ["IMPORT", "MER", "GD", "GM", "VP", "EVP", "VENDOR", "FORWARDER", "ADMIN"]);

    const { kind, fileId } = await context.params;
    const url = new URL(request.url);
    const forceDownload = url.searchParams.get("download") === "1";

    let fileRecord: { fileName: string; storageKey: string; mimeType: string } | null = null;
    if (kind === "pi") {
      fileRecord = await prisma.packagingPiFile.findUnique({
        where: { id: fileId },
        select: { fileName: true, storageKey: true, mimeType: true },
      });
    } else if (kind === "artwork") {
      fileRecord = await prisma.packagingArtwork.findUnique({
        where: { id: fileId },
        select: { fileName: true, storageKey: true, mimeType: true },
      });
    } else if (kind === "doc") {
      fileRecord = await prisma.caseDocument.findUnique({
        where: { id: fileId },
        select: { fileName: true, storageKey: true, mimeType: true },
      });
    } else {
      return NextResponse.json({ error: "ประเภทไฟล์ไม่ถูกต้อง" }, { status: 400 });
    }

    if (!fileRecord) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่ต้องการ" }, { status: 404 });
    }

    const { body, contentType } = await getObjectBuffer(fileRecord.storageKey);
    const disposition = forceDownload ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": fileRecord.mimeType || contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileRecord.fileName)}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
