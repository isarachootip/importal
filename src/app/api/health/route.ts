import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [users, sdepts, jobs] = await Promise.all([
      prisma.user.count(),
      prisma.sdeptMaster.count(),
      prisma.packagingJob.count(),
    ]);
    return NextResponse.json({
      status: "ok",
      app: "AW Packaging Tracker",
      timezone: "Asia/Bangkok",
      counts: { users, sdepts, jobs },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed";
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }
}
