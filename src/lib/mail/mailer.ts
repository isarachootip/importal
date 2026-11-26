import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";

let cachedTransport: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransport) return cachedTransport;
  const env = getEnv();
  cachedTransport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
  });
  return cachedTransport;
}

export async function sendEmail(params: {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (params.to.length === 0) return false;
  try {
    const env = getEnv();
    const fromHeader = env.SMTP_FROM.includes("Importal")
      ? "AW Packaging Tracker <no-reply@chg.co.th>"
      : env.SMTP_FROM;
    await getTransporter().sendMail({
      from: fromHeader,
      to: params.to.join(", "),
      ...(params.cc && params.cc.length > 0 ? { cc: params.cc.join(", ") } : {}),
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (err) {
    console.error("[AW Tracker Mailer] Failed to send email:", err);
    return false;
  }
}

export function renderAwEmailHtml(params: {
  toDisplay: string[];
  ccDisplay: string[];
  subject: string;
  sentDateFmt: string;
  mode: string;
  headText: string;
  piNumber: string;
  todoText: string;
  dueFmt: string | null;
  infoRows: Array<[string, string]>;
  note: string;
  jobUrl: string;
}): string {
  const firstTo = params.toDisplay[0] ?? "ผู้เกี่ยวข้อง";
  const greet = /^คุณ/.test(firstTo) ? firstTo : `ทีม ${firstTo.split(" ·")[0]}`;
  const noteLines = params.note ? params.note.split(" | ").join("<br/>") : "";
  const rowsHtml = params.infoRows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:3px 14px 3px 0;color:#5B6475">${k}</td><td style="padding:3px 0"><b>${v}</b></td></tr>`
    )
    .join("");

  return `<!doctype html><html lang="th"><body style="font-family:'IBM Plex Sans Thai',Tahoma,sans-serif;background:#F3F5F8;padding:20px;color:#1B2230">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E1E5EC;border-radius:10px;overflow:hidden">
  <div style="background:#1F3A5F;color:#fff;padding:12px 18px;font-weight:700;font-size:15px">AW Packaging Tracker · งานออกแบบบรรจุภัณฑ์ สินค้า Import</div>
  <div style="padding:12px 18px;background:#F6F8FB;font-size:13px;line-height:1.7;border-bottom:1px solid #E1E5EC">
    <div><b>ถึง:</b> ${params.toDisplay.join(", ")}</div>
    ${params.ccDisplay.length ? `<div><b>สำเนา:</b> ${params.ccDisplay.join(", ")}</div>` : ""}
    <div><b>เรื่อง:</b> ${params.subject}</div>
    <div style="color:#5B6475;font-size:12px">${params.sentDateFmt} · รูปแบบ: ${params.mode}</div>
  </div>
  <div style="padding:18px;font-size:14px;line-height:1.7">
    <p style="margin:0 0 10px">เรียน ${greet}</p>
    <p style="margin:0 0 12px">${params.headText} · งาน <b>${params.piNumber}</b>${params.dueFmt ? ` รอคุณดำเนินการ: <b>${params.todoText}</b> ภายใน <b style="color:#B4410C">${params.dueFmt}</b>` : ` (${params.todoText})`}</p>
    <table style="border-collapse:collapse;font-size:13px;margin-bottom:14px">${rowsHtml}</table>
    ${noteLines ? `<div style="padding:12px 14px;border-radius:8px;background:#FFF6EC;border:1px solid #F5D3B3;font-size:13px;margin-bottom:14px"><b>คอมเมนต์ / เหตุผล</b><br/>${noteLines}</div>` : ""}
    <a href="${params.jobUrl}" style="display:inline-block;background:#1F3A5F;color:#fff;padding:9px 16px;border-radius:8px;text-decoration:none;font-weight:600">เปิดงานในระบบ</a>
  </div>
</div></body></html>`;
}
