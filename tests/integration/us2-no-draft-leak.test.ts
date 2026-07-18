import { describe, it, expect } from "vitest";
import { createEntry, publishEntry } from "@/lib/content/entries";
import { listPublished, getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

const d = process.env.DATABASE_URL ? describe : describe.skip;

d("US2 no draft leakage (SC-003 / CG-1)", () => {
  it("keeps drafts out of the published list and detail, then exposes them once published", async () => {
    const actorId = await createTestUser();
    const created = await createEntry("insight", {
      data: { title: uniqueTitle("Insight"), body: "body text" },
      actorId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const { slug } = created.entry;

    // Draft: absent from list and detail.
    const list = await listPublished("insight", { pageSize: 100 });
    expect(list.items.some((i) => i.slug === slug)).toBe(false);
    expect(await getPublished("insight", slug)).toBeNull();

    // Publish: now visible.
    await publishEntry("insight", created.entry.id, actorId);
    expect(await getPublished("insight", slug)).not.toBeNull();
  });
});
