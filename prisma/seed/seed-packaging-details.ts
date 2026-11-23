import type { PrismaClient } from "@prisma/client";
import { buildApprovalsForStep, type ApprovalRule } from "../../src/lib/domain/packaging-machine";

export async function seedPackagingDetails(
  prisma: PrismaClient,
  userByEmail: Map<string, string>
) {
  const [jobs, ruleRows, importChecklists] = await Promise.all([
    prisma.packagingJob.findMany({
      include: {
        importCase: { select: { id: true, caseCode: true, ownerId: true } },
        approvals: { select: { id: true, stepKey: true } },
        comments: { select: { id: true } },
        preQcReviews: { select: { id: true } },
        checklistAnswers: { select: { id: true } },
      },
    }),
    prisma.approvalRuleConfig.findMany({ orderBy: [{ stageKey: "asc" }, { stepOrder: "asc" }] }),
    prisma.checklistItemConfig.findMany({ where: { category: "IMPORT_PRE_SUBMIT", isActive: true } }),
  ]);

  const rules: ApprovalRule[] = ruleRows.map((r) => ({
    stageKey: r.stageKey,
    stepOrder: r.stepOrder,
    role: r.role,
    isParallel: r.isParallel,
    isEnabled: r.isEnabled,
  }));

  const merId = userByEmail.get("mer@chg.co.th");
  const gdId = userByEmail.get("gd@chg.co.th");
  const gmId = userByEmail.get("gm@chg.co.th");
  const importKingId = userByEmail.get("naparat@chg.co.th");

  for (const job of jobs) {
    if (job.checklistAnswers.length === 0 && importChecklists.length > 0) {
      const checkedDefault = job.currentStep !== "INFO";
      await prisma.packagingChecklistAnswer.createMany({
        data: importChecklists.map((item) => ({
          packagingJobId: job.id,
          checklistItemId: item.id,
          checked: checkedDefault,
        })),
        skipDuplicates: true,
      });
    }

    if (job.importCase.caseCode === "IP-2026-021" && job.approvals.length === 0 && importKingId && merId && gdId) {
      await prisma.packagingApproval.createMany({
        data: [
          {
            packagingJobId: job.id,
            stepKey: "PROOF_1",
            round: 1,
            stepOrder: 1,
            role: "IMPORT",
            decision: "REVISION_REQUESTED",
            reason: "ปรับตำแหน่งโลโก้และเพิ่มขนาดตัวหนังสือภาษาไทย",
            actedById: importKingId,
            actedAt: new Date("2026-11-13T04:00:00.000Z"),
          },
          {
            packagingJobId: job.id,
            stepKey: "PROOF_1",
            round: 1,
            stepOrder: 1,
            role: "MER",
            decision: "REVISION_REQUESTED",
            reason: "ปรับขนาดมิติกล่องด้านหน้าให้ตรงตาม PI",
            actedById: merId,
            actedAt: new Date("2026-11-13T05:30:00.000Z"),
          },
          {
            packagingJobId: job.id,
            stepKey: "PROOF_2",
            round: 1,
            stepOrder: 1,
            role: "IMPORT",
            decision: "APPROVED",
            reason: "ข้อมูลครบถ้วน ถูกต้องตามแบบ",
            actedById: importKingId,
            actedAt: new Date("2026-11-21T03:30:00.000Z"),
          },
          {
            packagingJobId: job.id,
            stepKey: "PROOF_2",
            round: 1,
            stepOrder: 1,
            role: "MER",
            decision: "PENDING",
          },
        ],
      });

      if (job.comments.length === 0) {
        await prisma.packagingComment.createMany({
          data: [
            {
              packagingJobId: job.id,
              authorId: merId,
              authorRole: "MER",
              body: "ขนาดบนหน้ากล่องต้องเป็น 21.5×18.5×30 ซม.",
              createdAt: new Date("2026-11-21T02:12:00.000Z"),
            },
            {
              packagingJobId: job.id,
              authorId: importKingId,
              authorRole: "IMPORT",
              body: "เพิ่ม QR VDO การติดตั้งด้านข้าง",
              createdAt: new Date("2026-11-21T03:30:00.000Z"),
            },
          ],
        });
      }

      const existingAudit = await prisma.auditEvent.count({ where: { caseId: job.importCase.id } });
      if (existingAudit === 0) {
        await prisma.auditEvent.createMany({
          data: [
            {
              caseId: job.importCase.id,
              actorId: importKingId,
              actorRole: "IMPORT",
              stage: "PACKAGING",
              stepKey: "INFO",
              action: "CASE_CREATED",
              createdAt: new Date("2026-10-23T02:00:00.000Z"),
            },
            {
              caseId: job.importCase.id,
              actorId: gdId,
              actorRole: "GD",
              stage: "PACKAGING",
              stepKey: "AW_DRAFT_1",
              action: "PRE_QC_ACCEPT",
              reason: "ข้อมูลครบถ้วน รับงานเข้าออกแบบ",
              createdAt: new Date("2026-11-02T03:15:00.000Z"),
            },
            {
              caseId: job.importCase.id,
              actorId: importKingId,
              actorRole: "IMPORT",
              stage: "PACKAGING",
              stepKey: "PROOF_2",
              action: "APPROVE_STEP",
              reason: "ตรวจสอบ Draft 2 ผ่านเรียบร้อย",
              createdAt: new Date("2026-11-21T03:30:00.000Z"),
            },
          ],
        });
      }
      continue;
    }

    if (job.importCase.caseCode === "IP-2026-026" && job.preQcReviews.length === 0 && gdId) {
      await prisma.packagingPreQc.create({
        data: {
          packagingJobId: job.id,
          round: 1,
          decision: "REJECTED",
          failedCodes: ["PREQC_NO_DICUT", "PREQC_LOW_RES"],
          note: "ไฟล์ไดคัทยังไม่ระบุขนาดจริง และรูปถ่ายสินค้าความละเอียดต่ำกว่า 300 DPI",
          reviewerId: gdId,
        },
      });
    }

    if (job.importCase.caseCode === "IP-2026-024" && job.approvals.length === 0 && gmId) {
      await prisma.packagingApproval.createMany({
        data: [
          {
            packagingJobId: job.id,
            stepKey: "APPROVE_GM_VP",
            round: 1,
            stepOrder: 1,
            role: "GM",
            decision: "APPROVED",
            reason: "อนุมัติผ่าน (Case 1 Repeat Order)",
            actedById: gmId,
            actedAt: new Date("2026-11-20T04:00:00.000Z"),
          },
          {
            packagingJobId: job.id,
            stepKey: "APPROVE_EVP",
            round: 1,
            stepOrder: 1,
            role: "EVP",
            decision: "PENDING",
          },
        ],
      });
      continue;
    }

    const hasActiveStepApprovals = job.approvals.some((a) => a.stepKey === job.currentStep);
    if (!hasActiveStepApprovals) {
      const slots = buildApprovalsForStep(job.currentStep, rules);
      if (slots.length > 0) {
        await prisma.packagingApproval.createMany({
          data: slots.map((slot) => ({
            packagingJobId: job.id,
            stepKey: job.currentStep,
            round: 1,
            stepOrder: slot.stepOrder,
            role: slot.role,
            decision: "PENDING",
          })),
        });
      }
    }
  }
}
