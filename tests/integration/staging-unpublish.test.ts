import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
  unpublishEntry,
  getEntry,
} from "@/lib/content/entries";
import { getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: unpublish", () => {
  it("stops public serving and clears the pending flag", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "original" },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);
    await updateEntry("insight", id, { data: { title, body: "edited" }, actorId });

    await unpublishEntry("insight", id, actorId);

    const row = await getEntry("insight", id);
    expect(row?.status).toBe("draft");
    expect(row?.hasUnpublishedChanges).toBe(false);
    expect(await getPublished("insight", slug)).toBeNull();
  });
});
