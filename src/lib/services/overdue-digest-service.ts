import { prisma } from "@/lib/db/prisma";
import { isActionRequiredForUser } from "@/lib/domain/case-analytics";
import { BOARD_STATUS_LABELS } from "@/lib/domain/packaging-labels";
import { getEnv } from "@/lib/env";
import { sendEmail } from "@/lib/mail/mailer";
import { getEnrichedCaseSummaries } from "@/lib/services/dashboard-service";
import { formatDateShort } from "@/lib/utils/date-th";

export interface DigestRunResult {
  usersNotified: number;
  emailsSent: number;
  overdueItemsCount: number;
}

export async function runOverdueDigestJob(): Promise<DigestRunResult> {
  const env = getEnv();
  const [allCases, users] = await Promise.all([
    getEnrichedCaseSummaries(),
    prisma.user.findMany({
      where: { isActive: true },
      include: {
        roles: { select: { role: true } },
        ownedBrands: { select: { id: true } },
      },
    }),
  ]);

  const atRiskCases = allCases.filter(
    (c) => c.packaging && c.packaging.currentStep !== "COMPLETED" && (c.packaging.overdueDays > 0 || c.packaging.isDueSoon)
  );

  let usersNotified = 0;
  let emailsSent = 0;

  for (const u of users) {
    const sessionLike = {
      id: u.id,
      email: u.email,
      name: u.name,
      thaiName: u.thaiName,
      nickname: u.nickname,
      roles: u.roles.map((r) => r.role),
      ownedBrandIds: u.ownedBrands.map((b) => b.id),
    };

    const mine = atRiskCases.filter((c) => isActionRequiredForUser(c, sessionLike));
    if (mine.length === 0) continue;

    usersNotified += 1;
    const overdueCount = mine.filter((c) => (c.packaging?.overdueDays ?? 0) > 0).length;
    const title = `สรุปงานประจำวัน: ล่าช้า ${overdueCount} งาน / ใกล้ครบกำหนด ${mine.length - overdueCount} งาน`;

    const textLines = mine.map((c) => {
      const p = c.packaging!;
      const tag = p.overdueDays > 0 ? `ล่าช้า +${p.overdueDays} วัน` : "ใกล้ครบกำหนด";
      return `- ${c.caseCode} (${c.brandName}) ${c.productTitle} | ${BOARD_STATUS_LABELS[p.timelineStatus]} | กำหนด ${formatDateShort(p.stepPlannedEnd)} (${tag})`;
    });

    const rowsHtml = mine
      .map((c) => {
        const p = c.packaging!;
        const badgeColor = p.overdueDays > 0 ? "#b91c1c" : "#a16207";
        const tag = p.overdueDays > 0 ? `ล่าช้า +${p.overdueDays} วัน` : "ใกล้ครบกำหนด";
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e9ed;"><a href="${env.APP_BASE_URL}/cases/${c.caseCode}" style="color:#0f5c4d;font-weight:700;text-decoration:none;">${c.caseCode}</a></td>
          <td style="padding:8px;border-bottom:1px solid #e5e9ed;">${c.brandName} · ${c.productTitle}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e9ed;">${BOARD_STATUS_LABELS[p.timelineStatus]}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e9ed;color:${badgeColor};font-weight:700;">${formatDateShort(p.stepPlannedEnd)} (${tag})</td>
        </tr>`;
      })
      .join("");

    const html = `<!doctype html><html lang="th"><body style="font-family:'Sarabun',sans-serif;background:#eef1f4;padding:24px;color:#1f2933;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #d9dee3;border-radius:6px;overflow:hidden;">
        <div style="background:#0d3b33;color:#fff;padding:14px 20px;font-weight:700;">Importal · Daily Overdue Digest (08:00 น.)</div>
        <div style="padding:20px;">
          <p style="margin:0 0 12px;">เรียนคุณ ${u.nickname ?? u.thaiName ?? u.name}</p>
          <p style="margin:0 0 16px;color:#5f6b76;">${title}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f7f9;text-align:left;"><th style="padding:8px;">Case</th><th style="padding:8px;">สินค้า</th><th style="padding:8px;">สถานะ</th><th style="padding:8px;">กำหนด</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <p style="margin-top:18px;"><a href="${env.APP_BASE_URL}/" style="background:#0f5c4d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">เปิด Importal Dashboard</a></p>
        </div>
      </div></body></html>`;

    const created = await prisma.notification.create({
      data: {
        userId: u.id,
        type: "OVERDUE_DIGEST",
        title,
        body: textLines.join("\n"),
      },
    });

    const delivered = await sendEmail({
      to: u.email,
      subject: `[Importal 08:00 Digest] ${title}`,
      text: `${title}\n\n${textLines.join("\n")}\n\nDashboard: ${env.APP_BASE_URL}`,
      html,
    });

    if (delivered) {
      emailsSent += 1;
      await prisma.notification.update({
        where: { id: created.id },
        data: { emailSentAt: new Date() },
      });
    }
  }

  return { usersNotified, emailsSent, overdueItemsCount: atRiskCases.length };
}
