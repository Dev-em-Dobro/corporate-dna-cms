import { Resend } from "resend";
import type { LeadInput } from "@/lib/leads/schema";

const RECIPIENTS = [
  "ceo-office@corporatednaconsulting.com",
  "info@corporatednaconsulting.com",
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function leadNotificationContent(lead: LeadInput) {
  const fields = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Organisation", lead.organisation || "Not provided"],
    ["Page", lead.source || "Not provided"],
  ] as const;

  const html = [
    "<h1>New website contact</h1>",
    ...fields.map(
      ([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`,
    ),
    `<p><strong>Message:</strong></p><p style="white-space:pre-wrap">${escapeHtml(lead.message)}</p>`,
  ].join("");
  const text = [
    "New website contact",
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    lead.message,
  ].join("\n");

  return { html, text };
}

/** Send after the lead is saved, so a mail provider failure never loses the enquiry. */
export async function notifyLead(id: string, lead: LeadInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFY_FROM ?? process.env.EMAIL_FROM;
  if (!key || !from) {
    console.error("[leads] email notification not configured", { id });
    return false;
  }

  try {
    const { error } = await new Resend(key).emails.send({
      from,
      to: RECIPIENTS,
      replyTo: lead.email,
      subject: "New website contact - Corporate DNA",
      ...leadNotificationContent(lead),
    });
    if (error) {
      console.error("[leads] email notification rejected", { id, error });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[leads] email notification failed", { id, error });
    return false;
  }
}
