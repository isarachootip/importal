import type { TrackerSession } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import type { DraftData, OutboxMail } from "@/lib/domain/job-types";
import { NOTIF_DEFS, type NotifMode } from "@/lib/domain/rules-metadata";
import { HOL_DEFAULT, timeBangkokHm, todayBangkok } from "@/lib/domain/working-days";
import { listAllJobs } from "./job-service";

export async function getBootstrapState(session: TrackerSession) {
  const [jobs, holRows, draftRows, reviewRows, notifRows, outboxRows, staffRows] = await Promise.all([
    listAllJobs(),
    prisma.companyHoliday.findMany({ orderBy: { date: "asc" } }),
    prisma.formDraft.findMany(),
    prisma.metricReview.findMany(),
    prisma.notificationSetting.findMany(),
    prisma.emailOutbox.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { displayName: "asc" } }),
  ]);

  const holidays = holRows.length > 0 ? holRows.map((h) => h.date) : [...HOL_DEFAULT];

  const drafts: Record<string, DraftData> = {};
  for (const d of draftRows) {
    drafts[d.draftKey] = {
      key: d.draftKey,
      v: (d.values as Record<string, string | boolean>) ?? {},
      files: d.fileNames,
      d: d.savedDate,
      t: d.savedTime,
      by: d.savedBy,
    };
  }

  const reviews: Record<string, { st: string; note: string }> = {};
  for (const r of reviewRows) {
    reviews[r.reviewKey] = { st: r.status, note: r.note };
  }

  const notifModes: Record<string, NotifMode> = {};
  for (const def of NOTIF_DEFS) {
    notifModes[def.key] = def.defaultMode;
  }
  for (const n of notifRows) {
    notifModes[n.eventKey] = n.mode as NotifMode;
  }

  const outbox: OutboxMail[] = outboxRows.map((m) => ({
    id: m.id,
    t: m.sentDate,
    key: m.eventKey,
    jid: m.jobId,
    pi: m.piNumber,
    to: m.toList,
    toEmails: m.toEmails,
    cc: m.ccList,
    ccEmails: m.ccEmails,
    subj: m.subject,
    head: m.headText,
    todo: m.todoText,
    due: m.dueDate,
    info: (m.infoRows as Array<[string, string]>) ?? [],
    note: m.note,
    mode: m.mode,
    smtpDelivered: m.smtpDelivered,
  }));

  const staff = staffRows.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    displayName: u.displayName,
    nickname: u.nickname ?? u.displayName,
    jobTitle: u.jobTitle ?? "",
    role: u.role.toLowerCase(),
    orgLevel: u.orgLevel,
    sdeptCodes: u.sdeptCodes,
  }));

  return {
    today: todayBangkok(),
    session,
    jobs,
    holidays,
    drafts,
    reviews,
    notifModes,
    outbox,
    staff,
  };
}

export async function saveFormDraft(
  key: string,
  values: Record<string, string | boolean>,
  fileNames: string[],
  savedBy: string
): Promise<DraftData> {
  const savedDate = todayBangkok();
  const savedTime = timeBangkokHm();
  await prisma.formDraft.upsert({
    where: { draftKey: key },
    update: { values, fileNames, savedDate, savedTime, savedBy },
    create: { draftKey: key, values, fileNames, savedDate, savedTime, savedBy },
  });
  return { key, v: values, files: fileNames, d: savedDate, t: savedTime, by: savedBy };
}

export async function deleteFormDraft(key: string): Promise<void> {
  await prisma.formDraft.deleteMany({ where: { draftKey: key } });
}

export async function updateCompanyHolidays(dates: string[], resetDefault?: boolean): Promise<string[]> {
  const finalDates = resetDefault
    ? [...HOL_DEFAULT]
    : [...new Set(dates)].sort();

  await prisma.$transaction([
    prisma.companyHoliday.deleteMany(),
    prisma.companyHoliday.createMany({
      data: finalDates.map((date) => ({ date, nameTh: "วันหยุดประจำปี" })),
    }),
  ]);
  return finalDates;
}

export async function saveMetricReview(key: string, status: string, note: string): Promise<void> {
  await prisma.metricReview.upsert({
    where: { reviewKey: key },
    update: { status, note },
    create: { reviewKey: key, status, note },
  });
}

export async function updateNotifMode(eventKey: string, mode: NotifMode): Promise<void> {
  await prisma.notificationSetting.upsert({
    where: { eventKey },
    update: { mode },
    create: { eventKey, mode },
  });
}
