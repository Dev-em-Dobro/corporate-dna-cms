import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createEntry, publishEntry } from "@/lib/content/entries";
import { getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("insights author-approval gate", () => {
  it("masks an unapproved byline to 'Corporate DNA' on the public read", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "b", author: "Rhea Leckie", authorApproved: false },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);

    const pub = await getPublished("insight", slug);
    expect((pub?.data as { author: string }).author).toBe("Corporate DNA");
  });

  it("shows the real byline once approved", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "b", author: "Rhea Leckie", authorApproved: true },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);

    const pub = await getPublished("insight", slug);
    expect((pub?.data as { author: string }).author).toBe("Rhea Leckie");
  });
});
