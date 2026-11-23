import { prisma } from "@/lib/db/prisma";

export async function getMasterBootstrap() {
  const [brands, packagingTypes, caseConfigs, checklists, holidays, users, subclasses, vendors] =
    await Promise.all([
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: [{ groupName: "asc" }, { name: "asc" }],
        include: { owner: { select: { id: true, thaiName: true, nickname: true, email: true } } },
      }),
      prisma.packagingType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.packagingCaseConfig.findMany({ where: { isActive: true }, orderBy: { caseNumber: "asc" } }),
      prisma.checklistItemConfig.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.companyHoliday.findMany({ orderBy: { date: "asc" } }),
      prisma.user.findMany({
        where: { isActive: true },
        orderBy: { email: "asc" },
        include: { roles: { select: { role: true } } },
      }),
      prisma.productSubclass.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
      prisma.vendorFactory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

  return { brands, packagingTypes, caseConfigs, checklists, holidays, users, subclasses, vendors };
}
