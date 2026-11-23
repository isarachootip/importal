import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthEnabled } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const switchSchema = z.object({
  userId: z.string().min(1),
});

export async function GET() {
  if (!isDevAuthEnabled()) {
    return NextResponse.json({ error: "Dev auth is disabled" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      thaiName: true,
      nickname: true,
      roles: { select: { role: true } },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      thaiName: u.thaiName,
      nickname: u.nickname,
      roles: u.roles.map((r) => r.role),
    })),
  });
}

export async function POST(request: Request) {
  if (!isDevAuthEnabled()) {
    return NextResponse.json({ error: "Dev auth is disabled" }, { status: 403 });
  }

  const parsed = switchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid userId", issues: parsed.error.issues }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, isActive: true },
    select: { id: true, email: true, thaiName: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
