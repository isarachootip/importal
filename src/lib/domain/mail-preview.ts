import { NEXT_ACTION_LABEL, sdeptLabel, SUB_MAP, type SubStatus } from "./aw-constants";
import type { JobRecord, OutboxMail } from "./job-types";
import { findStaffByDisplayName, resolveMdsgRecipients } from "./mdsg-resolver";
import { NOTIF_DEFS, REMIND_DEFS } from "./rules-metadata";
import {
  briefLabelTh,
  curStatus,
  curSub,
  dayInStage,
  isOpenJob,
  isOverdue,
  jobPattern,
  lastNoteEntry,
  slaOf,
  stageStart,
} from "./sla-engine";
import { addWorkingDays, fmtThaiDate } from "./working-days";

export function buildClientEventPreviewMail(
  jobs: JobRecord[],
  key: string,
  today: string,
  holidays: ReadonlySet<string>,
  mode: string
): OutboxMail {
  const sample = jobs.find((j) => curSub(j) === key) ?? jobs.find(isOpenJob) ?? jobs[0]!;
  const def = NOTIF_DEFS.find((x) => x.key === key) ?? NOTIF_DEFS[0]!;
  const impEmail = findStaffByDisplayName(sample.importer)?.email ?? "import@chg.co.th";
  const desEmail = findStaffByDisplayName(sample.designer)?.email ?? "designer@chg.co.th";
  const mdsg = resolveMdsgRecipients(sample.sdepts);

  let to = [sample.importer];
  let toEmails = [impEmail];
  let cc: string[] = [];
  let ccEmails: string[] = [];

  if (key === "_create" || key === "Info Checking" || key === "In Production") {
    to = [sample.designer]; toEmails = [desEmail];
  } else if (key === "Photo Shoot") {
    to = ["Photo Team"]; toEmails = ["photo@chg.co.th"]; cc = [sample.designer]; ccEmails = [desEmail];
  } else if (key === "MDSG Review") {
    to = [mdsg.displayLabel]; toEmails = mdsg.emails;
  } else if (["Revising", "Present AW", "EVP Revising", "Final AW"].includes(key)) {
    to = [sample.designer]; toEmails = [desEmail]; cc = [sample.importer]; ccEmails = [impEmail];
  } else if (key === "EVP Review") {
    to = ["K.Chodok (EVP)"]; toEmails = ["BhChodok@chg.co.th"]; cc = ["คุณพีท (Designer GM)"]; ccEmails = ["SangtNarin@chg.co.th"];
  } else if (key === "Goods Received") {
    to = [sample.importer]; toEmails = [impEmail]; cc = [sample.designer]; ccEmails = [desEmail];
  } else if (key === "Cancelled") {
    to = [sample.importer, sample.designer]; toEmails = [impEmail, desEmail];
  }

  const fyi = def.todo.startsWith("แจ้งให้ทราบ");
  const subDef = SUB_MAP[key as SubStatus];
  const due = fyi
    ? null
    : key === "_create"
      ? addWorkingDays(today, 2, holidays)
      : key === "MDSG Review"
        ? addWorkingDays(stageStart(sample), 2, holidays)
        : subDef?.sla != null
          ? addWorkingDays(today, subDef.sla, holidays)
          : null;

  const fb = lastNoteEntry(sample);
  const p = jobPattern(sample);
  const shortTodo = def.todo.split(/ [(·]/)[0] ?? def.todo;

  return {
    id: "PREVIEW",
    t: today,
    key,
    jid: sample.id,
    pi: sample.pi,
    to,
    toEmails,
    cc,
    ccEmails,
    subj: `[AW] ${sample.pi} · ${fyi ? def.whenLabel : `รอคุณ: ${shortTodo}`}${due ? ` (ครบกำหนด ${fmtThaiDate(due)})` : ""}`,
    head: def.whenLabel,
    todo: def.todo,
    due,
    info: [
      ["House Brand", sample.brand],
      ["Pattern", p.name],
      ["Sdept", sample.sdepts.map(sdeptLabel).join(" / ")],
      ["Items", `${sample.items} items`],
      ["ประชุม Brief", briefLabelTh(sample.brief)],
      ["Supplier", sample.supplier],
      ["Status", `${curStatus(sample)} › ${curSub(sample)}`],
    ],
    note: fb && ["Revising", "EVP Revising", "Info Incomplete", "Cancelled"].includes(key) ? fb.note : "",
    mode,
  };
}

export function buildClientRemindPreviewMail(
  jobs: JobRecord[],
  remindId: string,
  today: string,
  holidays: ReadonlySet<string>
): OutboxMail {
  const j = jobs.find((x) => isOverdue(x, today, holidays)) ?? jobs.find(isOpenJob) ?? jobs[0]!;
  const s = curSub(j);
  const r = SUB_MAP[s].roles[0] ?? "designer";
  const n = NOTIF_DEFS.find((x) => x.key === s);
  const late = remindId !== "r1";
  const mdsg = resolveMdsgRecipients(j.sdepts);
  const remindRow = REMIND_DEFS.find((x) => x[0] === remindId) ?? REMIND_DEFS[0]!;

  const toName =
    r === "designer" ? j.designer : r === "import" ? j.importer : r === "mdsg" ? mdsg.displayLabel : r === "evp" ? "K.Chodok (EVP)" : r === "photographer" ? "Photo Team" : "Factory";

  return {
    id: "PREVIEW_REMIND",
    t: today,
    key: remindId,
    jid: j.id,
    pi: j.pi,
    to: [toName],
    toEmails: [],
    cc: late ? ["หัวหน้าทีม", ...(remindId === "r3" ? ["Director Omnichannel"] : [])] : [],
    ccEmails: [],
    subj: `[AW] ${late ? "เกิน SLA" : "ใกล้ครบ SLA"} · ${j.pi} · ${NEXT_ACTION_LABEL[s] ?? s}${late ? ` (+${Math.max(dayInStage(j, today, holidays) - (slaOf(j) ?? 1), 1)} วัน)` : ""}`,
    head: late ? `งานเกิน SLA ของขั้น ${s}` : "งานใกล้ครบกำหนด",
    todo: n ? n.todo : SUB_MAP[s].label,
    due: addWorkingDays(stageStart(j), slaOf(j) ?? 1, holidays),
    info: [
      ["House Brand", j.brand],
      ["Pattern", jobPattern(j).name],
      ["Status", `${curStatus(j)} › ${s}`],
      ["อยู่ในขั้นนี้", `${dayInStage(j, today, holidays)} วันทำงาน · SLA ${slaOf(j) ?? "–"}`],
    ],
    note: "",
    mode: remindRow[5],
  };
}
