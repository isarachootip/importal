import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMasterBootstrap } from "@/lib/services/master-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const data = await getMasterBootstrap();
  return NextResponse.json({ currentUser: user, ...data });
}
