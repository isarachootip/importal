import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [users, brands, cases] = await Promise.all([
      prisma.user.count(),
      prisma.brand.count(),
      prisma.importCase.count(),
    ]);
    return NextResponse.json({
      status: "ok",
      timezone: "Asia/Bangkok",
      counts: { users, brands, cases },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed";
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }
}
