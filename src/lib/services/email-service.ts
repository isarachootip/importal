import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { sdeptLabel, SUB_MAP, type SubStatus } from "@/lib/domain/aw-constants";
import type { JobRecord, OutboxMail } from "@/lib/domain/job-types";
import { findStaffByDisplayName, resolveMdsgRecipients } from "@/lib/domain/mdsg-resolver";
import { NOTIF_DEFS } from "@/lib/domain/rules-metadata";
import { briefLabelTh, curStatus, curSub, jobPattern, lastNoteEntry, stageStart } from "@/lib/domain/sla-engine";
import { addWorkingDays, fmtThaiDate } from "@/lib/domain/working-days";
import { renderAwEmailHtml, sendEmail } from "@/lib/mail/mailer";

const DESIGNER_GM = { display: "คุณพีท (Designer GM)", email: "SangtNarin@chg.co.th" };
const EVP_USER = { display: "K.Chodok (EVP)", email: "BhChodok@chg.co.th" };
const PHOTO_USER = { display: "Photo Team", email: "photo@chg.co.th" };

function resolveEventRecipients(j: JobRecord, key: string): {
  to: string[];
  toEmails: string[];
  cc: string[];
  ccEmails: string[];
} {
  const impEmail = findStaffByDisplayName(j.importer)?.email ?? "import@chg.co.th";
  const desEmail = findStaffByDisplayName(j.designer)?.email ?? "designer@chg.co.th";
  const mdsg = resolveMdsgRecipients(j.sdepts);

  switch (key) {
    case "_create":
    case "Info Checking":
      return { to: [j.designer], toEmails: [desEmail], cc: [], ccEmails: [] };
    case "Info Incomplete":
    case "Drafting":
    case "Import Review":
    case "Send to Factory":
      return { to: [j.importer], toEmails: [impEmail], cc: [], ccEmails: [] };
    case "Photo Shoot":
      return { to: [PHOTO_USER.display], toEmails: [PHOTO_USER.email], cc: [j.designer], ccEmails: [desEmail] };
    case "MDSG Review":
      return { to: [mdsg.displayLabel], toEmails: mdsg.emails, cc: [], ccEmails: [] };
    case "Revising":
    case "Present AW":
    case "EVP Revising":
    case "Final AW":
      return { to: [j.designer], toEmails: [desEmail], cc: [j.importer], ccEmails: [impEmail] };
    case "EVP Review":
      return { to: [EVP_USER.display], toEmails: [EVP_USER.email], cc: [DESIGNER_GM.display], ccEmails: [DESIGNER_GM.email] };
    case "In Production":
      return { to: [j.designer], toEmails: [desEmail], cc: [], ccEmails: [] };
    case "Goods Received":
      return { to: [j.importer], toEmails: [impEmail], cc: [j.designer], ccEmails: [desEmail] };
    case "Cancelled":
      return { to: [j.importer, j.designer], toEmails: [impEmail, desEmail], cc: [], ccEmails: [] };
    default:
      return { to: [j.importer], toEmails: [impEmail], cc: [], ccEmails: [] };
  }
}

function computeDueForEvent(j: JobRecord, key: string, today: string, holidays: ReadonlySet<string>): string | null {
  if (key === "_create") return addWorkingDays(today, 2, holidays);
  if (key === "MDSG Review") return addWorkingDays(stageStart(j), 2, holidays);
  if (key === "In Production") return addWorkingDays(today, (j.leadtime ?? 55) + 20, holidays);
  const subDef = SUB_MAP[key as SubStatus];
  if (subDef && subDef.sla != null) return addWorkingDays(today, subDef.sla, holidays);
  return null;
}

export function buildMailData(
  j: JobRecord,
  key: string,
  today: string,
  holidays: ReadonlySet<string>,
  mode = "ทันที"
): Omit<OutboxMail, "id"> | null {
  const def = NOTIF_DEFS.find((x) => x.key === key);
  if (!def) return null;
  const rec = resolveEventRecipients(j, key);
  const fyi = def.todo.startsWith("แจ้งให้ทราบ");
  const due = fyi ? null : computeDueForEvent(j, key, today, holidays);
  const fb = lastNoteEntry(j);
  const p = jobPattern(j);
  const sdeptsStr = j.sdepts.map(sdeptLabel).join(" / ");
  const shortTodo = def.todo.split(/ [(·]/)[0] ?? def.todo;

  return {
    t: today,
    key,
    jid: j.id,
    pi: j.pi,
    to: rec.to,
    toEmails: rec.toEmails,
    cc: rec.cc,
    ccEmails: rec.ccEmails,
    subj: `[AW] ${j.pi} · ${fyi ? def.whenLabel : `รอคุณ: ${shortTodo}`}${due ? ` (ครบกำหนด ${fmtThaiDate(due)})` : ""}`,
    head: def.whenLabel,
    todo: def.todo,
    due,
    info: [
      ["House Brand", j.brand],
      ["Pattern", p.name],
      ["Sdept", sdeptsStr],
      ["Items", `${j.items} items`],
      ["ประชุม Brief", briefLabelTh(j.brief)],
      ["Supplier", j.supplier],
      ["Status", `${curStatus(j)} › ${curSub(j)}`],
    ],
    note: fb && ["Revising", "EVP Revising", "Info Incomplete", "Cancelled"].includes(key) ? fb.note : "",
    mode,
  };
}

export async function dispatchJobNotification(
  j: JobRecord,
  key: string,
  today: string,
  holidays: ReadonlySet<string>
): Promise<OutboxMail | null> {
  const setting = await prisma.notificationSetting.findUnique({ where: { eventKey: key } });
  const def = NOTIF_DEFS.find((x) => x.key === key);
  const mode = setting?.mode ?? def?.defaultMode ?? "ทันที";
  if (mode === "ปิด") return null;

  const data = buildMailData(j, key, today, holidays, mode);
  if (!data) return null;

  let smtpDelivered = false;
  if (mode === "ทันที" && data.toEmails.length > 0) {
    const baseUrl = getEnv().APP_BASE_URL;
    const html = renderAwEmailHtml({
      toDisplay: data.to,
      ccDisplay: data.cc,
      subject: data.subj,
      sentDateFmt: fmtThaiDate(data.t),
      mode: data.mode,
      headText: data.head,
      piNumber: j.pi,
      todoText: data.todo,
      dueFmt: data.due ? fmtThaiDate(data.due) : null,
      infoRows: data.info,
      note: data.note,
      jobUrl: `${baseUrl}/jobs/${encodeURIComponent(j.id)}`,
    });
    smtpDelivered = await sendEmail({
      to: data.toEmails,
      cc: data.ccEmails,
      subject: data.subj,
      html,
      text: `${data.head} · ${j.pi} · ${data.todo}`,
    });
  }

  const saved = await prisma.emailOutbox.create({
    data: {
      sentDate: data.t,
      eventKey: data.key,
      jobId: data.jid,
      piNumber: data.pi,
      toList: data.to,
      toEmails: data.toEmails,
      ccList: data.cc,
      ccEmails: data.ccEmails,
      subject: data.subj,
      headText: data.head,
      todoText: data.todo,
      dueDate: data.due,
      infoRows: data.info,
      note: data.note,
      mode: data.mode,
      smtpDelivered,
    },
  });

  return { ...data, id: saved.id, smtpDelivered };
}
