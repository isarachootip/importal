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
    ...(env.SMTP_USER
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });
  return cachedTransport;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  try {
    const env = getEnv();
    await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (err) {
    console.error("[Importal Mailer] Failed to send email:", err);
    return false;
  }
}

export function buildNotificationEmailHtml(params: {
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const buttonHtml = params.ctaUrl
    ? `<p style="margin-top:20px;"><a href="${params.ctaUrl}" style="background:#0f5c4d;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">${params.ctaLabel ?? "เปิดดูใน Importal"}</a></p>`
    : "";

  return `<!doctype html>
<html lang="th">
  <body style="font-family:'Sarabun',sans-serif;background:#eef1f4;padding:24px;color:#1f2933;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9dee3;border-radius:6px;overflow:hidden;">
      <div style="background:#0d3b33;color:#ffffff;padding:14px 20px;font-weight:700;font-size:16px;">Importal · ระบบบริหารงานนำเข้า</div>
      <div style="padding:20px;">
        <h2 style="margin:0 0 8px;font-size:18px;color:#1f2933;">${params.title}</h2>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#5f6b76;white-space:pre-line;">${params.body}</p>
        ${buttonHtml}
      </div>
    </div>
  </body>
</html>`;
}
