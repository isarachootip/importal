import type { NotificationType, PackagingStepKey, RoleCode } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { STEP_LABELS } from "@/lib/domain/packaging-labels";
import { getEnv } from "@/lib/env";
import { buildNotificationEmailHtml, sendEmail } from "@/lib/mail/mailer";
import type { PackagingTransitionInput } from "@/lib/validations/packaging";

interface RecipientUser {
  id: string;
  email: string;
}

export async function dispatchNotifications(params: {
  recipients: RecipientUser[];
  caseId?: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath?: string;
}): Promise<number> {
  if (params.recipients.length === 0) return 0;
  const env = getEnv();
  const ctaUrl = params.linkPath ? `${env.APP_BASE_URL}${params.linkPath}` : undefined;
  let sentCount = 0;

  for (const user of params.recipients) {
    const created = await prisma.notification.create({
      data: {
        userId: user.id,
        caseId: params.caseId ?? null,
        type: params.type,
        title: params.title,
        body: params.body,
      },
    });

    const delivered = await sendEmail({
      to: user.email,
      subject: `[Importal] ${params.title}`,
      text: ctaUrl ? `${params.body}\n\nเปิดดู: ${ctaUrl}` : params.body,
      html: buildNotificationEmailHtml({ title: params.title, body: params.body, ctaUrl }),
    });

    if (delivered) {
      sentCount += 1;
      await prisma.notification.update({
        where: { id: created.id },
        data: { emailSentAt: new Date() },
      });
    }
  }
  return sentCount;
}

async function usersWithRoles(roles: readonly RoleCode[]): Promise<RecipientUser[]> {
  if (roles.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { isActive: true, roles: { some: { role: { in: [...roles] } } } },
    select: { id: true, email: true },
  });
  return users;
}

export async function notifyPackagingTransition(params: {
  caseId: string;
  caseCode: string;
  productTitle: string;
  ownerId: string;
  actionType: PackagingTransitionInput["type"];
  nextStep: PackagingStepKey;
  nextPendingRoles: readonly RoleCode[];
  reason?: string;
}) {
  let type: NotificationType = "YOUR_TURN";
  let rolesToNotify: RoleCode[] = [...params.nextPendingRoles];
  let includeOwner = false;

  if (params.actionType === "PRE_QC_REJECT") {
    type = "PRE_QC_REJECTED";
    includeOwner = true;
    rolesToNotify = [];
  } else if (params.actionType === "REQUEST_REVISION") {
    type = "REVISION_REQUESTED";
    rolesToNotify = ["GD"];
  } else if (params.actionType === "SUBMIT_PI" || params.actionType === "PRE_QC_ACCEPT") {
    rolesToNotify = ["GD"];
  } else if (params.nextStep === "FINAL_FILE") {
    type = "APPROVED";
    rolesToNotify = ["GD"];
    includeOwner = true;
  } else if (params.nextStep === "COMPLETED") {
    type = "APPROVED";
    includeOwner = true;
  }

  const recipientMap = new Map<string, RecipientUser>();
  for (const u of await usersWithRoles(rolesToNotify)) {
    recipientMap.set(u.id, u);
  }
  if (includeOwner) {
    const owner = await prisma.user.findUnique({ where: { id: params.ownerId }, select: { id: true, email: true } });
    if (owner) recipientMap.set(owner.id, owner);
  }

  const stepText = STEP_LABELS[params.nextStep];
  const title = `${params.caseCode}: ${stepText}`;
  const body = `${params.productTitle}\nขั้นตอนถัดไป: ${stepText}${params.reason ? `\nหมายเหตุ: ${params.reason}` : ""}`;

  await dispatchNotifications({
    recipients: Array.from(recipientMap.values()),
    caseId: params.caseId,
    type,
    title,
    body,
    linkPath: `/cases/${params.caseCode}`,
  });
}

export async function listUserNotifications(userId: string) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { importCase: { select: { caseCode: true } } },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, unreadCount };
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { isRead: true },
  });
}
