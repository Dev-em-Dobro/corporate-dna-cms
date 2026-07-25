import { describe, it, expect } from "vitest";
import { leadInputSchema } from "@/lib/leads/schema";

describe("lead validation (TAREFA 1)", () => {
  it("accepts a valid lead and normalises email + trims strings", () => {
    const r = leadInputSchema.safeParse({
      name: "  Ada Lovelace  ",
      email: "  Ada@Example.COM ",
      organisation: "  Analytical Engines ",
      message: "  We need help.  ",
      source: "/contact?utm_source=x",
    });
    expect(r.success).toBe(true);
    expect(r.data!.name).toBe("Ada Lovelace");
    expect(r.data!.email).toBe("ada@example.com");
    expect(r.data!.organisation).toBe("Analytical Engines");
    expect(r.data!.message).toBe("We need help.");
    expect(r.data!.source).toBe("/contact?utm_source=x");
  });

  it("collapses blank / absent optional fields to null", () => {
    const r = leadInputSchema.safeParse({
      name: "A",
      email: "a@b.com",
      message: "hi",
      organisation: "   ",
    });
    expect(r.success).toBe(true);
    expect(r.data!.organisation).toBeNull();
    expect(r.data!.source).toBeNull();
    expect(r.data!.referer).toBeNull();
    expect(r.data!.user_agent).toBeNull();
  });

  it("rejects a missing name", () => {
    const r = leadInputSchema.safeParse({ email: "a@b.com", message: "hi" });
    expect(r.success).toBe(false);
  });

  it("rejects a whitespace-only message", () => {
    const r = leadInputSchema.safeParse({
      name: "A",
      email: "a@b.com",
      message: "    ",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const r = leadInputSchema.safeParse({
      name: "A",
      email: "not-an-email",
      message: "hi",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long message (>5000)", () => {
    const r = leadInputSchema.safeParse({
      name: "A",
      email: "a@b.com",
      message: "x".repeat(5001),
    });
    expect(r.success).toBe(false);
  });
});
