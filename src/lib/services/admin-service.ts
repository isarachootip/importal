import { assertAnyRole } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import type { AdminMasterMutationInput } from "@/lib/validations/admin";

export async function getAdminMasterData() {
  const [brands, users, caseConfigs, approvalRules, holidays, settings] = await Promise.all([
    prisma.brand.findMany({
      orderBy: [{ groupName: "asc" }, { name: "asc" }],
      include: { owner: { select: { id: true, thaiName: true, nickname: true } } },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { email: "asc" },
      include: { roles: { select: { role: true } } },
    }),
    prisma.packagingCaseConfig.findMany({ orderBy: { caseNumber: "asc" } }),
    prisma.approvalRuleConfig.findMany({ orderBy: [{ stageKey: "asc" }, { stepOrder: "asc" }] }),
    prisma.companyHoliday.findMany({ orderBy: { date: "asc" } }),
    prisma.systemSetting.findMany({ orderBy: { key: "asc" } }),
  ]);

  return { brands, users, caseConfigs, approvalRules, holidays, settings };
}

export async function applyAdminMasterMutation(
  input: AdminMasterMutationInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["ADMIN"]);

  switch (input.entity) {
    case "BRAND_UPDATE":
      return prisma.brand.update({
        where: { id: input.id },
        data: {
          ownerId: input.ownerId || null,
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

    case "BRAND_CREATE":
      return prisma.brand.create({
        data: {
          code: input.code.toUpperCase(),
          name: input.name,
          groupName: input.groupName,
          ownerId: input.ownerId || null,
        },
      });

    case "CASE_CONFIG_UPDATE":
      return prisma.packagingCaseConfig.update({
        where: { id: input.id },
        data: {
          infoDays: input.infoDays,
          designDays: input.designDays,
          productionDays: input.productionDays,
          logisticDays: input.logisticDays,
        },
      });

    case "APPROVAL_RULE_TOGGLE":
      return prisma.approvalRuleConfig.update({
        where: { id: input.id },
        data: { isEnabled: input.isEnabled },
      });

    case "HOLIDAY_CREATE": {
      const yearCE = Number(input.date.slice(0, 4));
      return prisma.companyHoliday.create({
        data: {
          date: new Date(`${input.date}T00:00:00.000Z`),
          yearBE: yearCE + 543,
          nameTh: input.nameTh,
          isSubstitute: input.isSubstitute,
          announcementRef: "ADMIN_MANUAL",
        },
      });
    }

    case "HOLIDAY_DELETE":
      return prisma.companyHoliday.delete({ where: { id: input.id } });

    case "SYSTEM_SETTING_UPDATE":
      return prisma.systemSetting.upsert({
        where: { key: input.key },
        update: { value: input.value },
        create: { key: input.key, value: input.value },
      });
  }
}
