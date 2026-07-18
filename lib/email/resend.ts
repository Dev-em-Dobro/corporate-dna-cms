import { Resend } from "resend";

/** Best-effort transactional email. No-ops (with a warning) if unconfigured. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", opts.to);
    return;
  }
  const from = process.env.EMAIL_FROM ?? "Corporate DNA CMS <onboarding@resend.dev>";
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (e) {
    console.error("[email] send failed:", e);
  }
}
