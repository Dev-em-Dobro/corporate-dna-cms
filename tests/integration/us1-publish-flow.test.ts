import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createEntry, publishEntry } from "@/lib/content/entries";
import { listPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";


function validCase(title: string) {
  return {
    title,
    quote: "q",
    quoter: "Jane Doe",
    introduction: "intro",
    text: "body",
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
    // Cases no longer carry a media field; use `insight`, which has a cover image.
    const data = {
      title: uniqueTitle("Insight"),
      body: "b",
      coverMediaId: crypto.randomUUID(),
    };
    const created = await createEntry("insight", { data, actorId });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const published = await publishEntry("insight", created.entry.id, actorId);
    expect(published.ok).toBe(false); // media gate
  });
});
