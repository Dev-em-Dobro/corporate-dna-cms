import { afterEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { leadNotificationContent, notifyLead } from "@/lib/leads/notify";

const lead = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  organisation: "Analytical Engines",
  message: "Hello <team> & thanks\nPlease call me.",
  source: "/contact?utm_source=test",
  referer: null,
  user_agent: null,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("lead notification", () => {
  it("sends the complete contact to both inboxes and sets Reply-To", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("LEAD_NOTIFY_FROM", "Corporate DNA <contact@example.com>");
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });

    expect(await notifyLead("lead-1", lead)).toBe(true);
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [
          "ceo-office@corporatednaconsulting.com",
          "info@corporatednaconsulting.com",
        ],
        replyTo: lead.email,
        text: expect.stringContaining(lead.message),
      }),
    );
    const content = leadNotificationContent(lead);
    expect(content.text).toContain(lead.name);
    expect(content.text).toContain(lead.email);
    expect(content.text).toContain(lead.organisation);
    expect(content.html).toContain("Hello &lt;team&gt; &amp; thanks");
    expect(content.html).not.toContain("Hello <team>");
  });

  it("reports provider errors instead of treating them as delivered", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("LEAD_NOTIFY_FROM", "Corporate DNA <contact@example.com>");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({ data: null, error: { message: "Rejected" } });

    expect(await notifyLead("lead-2", lead)).toBe(false);
    expect(log).toHaveBeenCalledWith(
      "[leads] email notification rejected",
      expect.objectContaining({ id: "lead-2" }),
    );
    log.mockRestore();
  });
});
