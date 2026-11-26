import { OrgLevel, type PrismaClient, TrackerRole } from "@prisma/client";
import { DESIGNER_STAFF, IMPORT_STAFF, SDEPT_MASTER, SPECIAL_STAFF, type StaffMemberDef } from "@/lib/domain/directory-import-design";
import { MDSG_STAFF } from "@/lib/domain/directory-mdsg";
import { generateDemoJobs } from "@/lib/domain/demo-generator";
import { NOTIF_DEFS } from "@/lib/domain/rules-metadata";
import { HOL_DEFAULT, todayBangkok } from "@/lib/domain/working-days";

const ROLE_ENUM_MAP: Record<StaffMemberDef["role"], TrackerRole> = {
  import: TrackerRole.IMPORT,
  mdsg: TrackerRole.MDSG,
  evp: TrackerRole.EVP,
  designer: TrackerRole.DESIGNER,
  photographer: TrackerRole.PHOTOGRAPHER,
  mgmt: TrackerRole.MGMT,
};

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  for (const sd of SDEPT_MASTER) {
    await prisma.sdeptMaster.upsert({
      where: { code: sd.code },
      update: { name: sd.name, vpGroup: sd.vpGroup, gmDivision: sd.gmDivision },
      create: sd,
    });
  }

  for (const iso of HOL_DEFAULT) {
    await prisma.companyHoliday.upsert({
      where: { date: iso },
      update: {},
      create: { date: iso, nameTh: "วันหยุดตามประเพณี" },
    });
  }

  for (const n of NOTIF_DEFS) {
    await prisma.notificationSetting.upsert({
      where: { eventKey: n.key },
      update: {},
      create: { eventKey: n.key, mode: n.defaultMode },
    });
  }

  const allStaff: StaffMemberDef[] = [...DESIGNER_STAFF, ...IMPORT_STAFF, ...MDSG_STAFF, ...SPECIAL_STAFF];
  for (const u of allStaff) {
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        fullName: u.fullName,
        displayName: u.displayName,
        nickname: u.nickname,
        jobTitle: u.jobTitle,
        role: ROLE_ENUM_MAP[u.role],
        orgLevel: u.orgLevel as OrgLevel,
        groupName: u.groupName ?? null,
        sdeptCodes: u.sdeptCodes,
      },
      create: {
        email: u.email.toLowerCase(),
        fullName: u.fullName,
        displayName: u.displayName,
        nickname: u.nickname,
        jobTitle: u.jobTitle,
        role: ROLE_ENUM_MAP[u.role],
        orgLevel: u.orgLevel as OrgLevel,
        groupName: u.groupName ?? null,
        sdeptCodes: u.sdeptCodes,
      },
    });
  }

  const existingJobs = await prisma.packagingJob.count();
  if (existingJobs === 0) {
    await resetDemoJobsInDb(prisma);
  }
}

export async function resetDemoJobsInDb(prisma: PrismaClient): Promise<number> {
  const holRows = await prisma.companyHoliday.findMany({ select: { date: true } });
  const holidays = new Set(holRows.length > 0 ? holRows.map((h) => h.date) : HOL_DEFAULT);
  const today = todayBangkok();
  const demoJobs = generateDemoJobs(today, holidays);

  await prisma.$transaction([
    prisma.formDraft.deleteMany(),
    prisma.emailOutbox.deleteMany(),
    prisma.packagingJob.deleteMany(),
  ]);

  for (const j of demoJobs) {
    await prisma.packagingJob.create({
      data: {
        jobCode: j.jobCode,
        piNumber: j.pi,
        piDate: j.piDate,
        bu: j.bu,
        supplier: j.supplier,
        brand: j.brand,
        patternId: j.pattern,
        sdeptCodes: j.sdepts,
        itemCount: j.items,
        license: j.license,
        packages: j.packages,
        importerName: j.importer,
        designerName: j.designer,
        briefRequired: j.brief,
        folderUrl: j.folder,
        hasPhotoShoot: j.photo,
        leadtimeDays: j.leadtime ?? null,
        poNumber: j.poNumber ?? null,
        skuFileName: j.skuFile ?? null,
        history: {
          create: j.history.map((h, idx) => ({
            seq: idx,
            subStatus: h.sub,
            actionDate: h.d,
            actorRole: h.by,
            actionTitle: h.act,
            note: h.note,
            mark: h.mark ?? null,
          })),
        },
        files: {
          create: j.files.map((f) => ({
            fileName: f.name,
            isLink: Boolean(f.link),
            uploadedByRole: f.by,
            uploadedDate: f.d,
          })),
        },
        skus: {
          create: j.skus.map((s, idx) => ({
            seq: idx,
            skuCode: s.sku,
            mmsCreatedDate: s.created,
            goodsReceivedDate: s.gr,
          })),
        },
      },
    });
  }

  return demoJobs.length;
}
