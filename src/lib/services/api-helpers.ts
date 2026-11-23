import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/types";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    const status = error.code === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: first?.message ?? "ข้อมูลไม่ถูกต้อง",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "ข้อมูลซ้ำในระบบ (เช่น เลขที่ PI หรือรหัส Case มีอยู่แล้ว)" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบข้อมูลที่ต้องการ" }, { status: 404 });
    }
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
}
