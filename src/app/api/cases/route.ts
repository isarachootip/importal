import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/services/api-helpers";
import { createImportCaseWithPi } from "@/lib/services/case-service";
import { createCaseSchema } from "@/lib/validations/case";

export async function GET() {
  try {
    const cases = await prisma.importCase.findMany({
      orderBy: { caseCode: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
        owner: { select: { id: true, thaiName: true, nickname: true } },
        packaging: {
          include: {
            caseConfig: { select: { caseNumber: true, name: true } },
          },
        },
      },
    });
    return NextResponse.json({ cases });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body: unknown = await request.json();
    const parsed = createCaseSchema.parse(body);
    const created = await createImportCaseWithPi(parsed, user);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
