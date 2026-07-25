import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
} from "@/lib/content/entries";
import { getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: the public read API serves the snapshot", () => {
  it("keeps serving the last published content until re-publish", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "original" },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);

    await updateEntry("insight", id, {
      data: { title, body: "edited" },
      actorId,
    });

    const stale = await getPublished("insight", slug);
    expect((stale?.data as { body: string }).body).toBe("original");

    await publishEntry("insight", id, actorId);
    const fresh = await getPublished("insight", slug);
    expect((fresh?.data as { body: string }).body).toBe("edited");
  });
});
