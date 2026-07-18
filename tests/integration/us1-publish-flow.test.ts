import { describe, it, expect } from "vitest";
import { createEntry, publishEntry } from "@/lib/content/entries";
import { listPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

const d = process.env.DATABASE_URL ? describe : describe.skip;

function validCase(title: string) {
  return {
    title,
    challenge: "c",
    approach: "a",
    outcome: "o",
    measurableResult: "m",
    clientQuote: "q",
  };
}

d("US1 create -> publish flow", () => {
  it("publishes a valid case and it appears in the published API", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Case");
    const created = await createEntry("case", { data: validCase(title), actorId });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const published = await publishEntry("case", created.entry.id, actorId);
    expect(published.ok).toBe(true);

    const list = await listPublished("case", { pageSize: 100 });
    expect(list.items.some((i) => i.slug === created.entry.slug)).toBe(true);
  });

  it("blocks publish when a referenced media asset does not exist", async () => {
    const actorId = await createTestUser();
    const data = { ...validCase(uniqueTitle("Case")), coverMediaId: crypto.randomUUID() };
    const created = await createEntry("case", { data, actorId });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const published = await publishEntry("case", created.entry.id, actorId);
    expect(published.ok).toBe(false); // media gate
  });
});
