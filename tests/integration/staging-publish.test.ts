import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createEntry, publishEntry, getEntry } from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: publish snapshots the working copy", () => {
  it("copies data into publishedData and clears the pending flag", async () => {
    const actorId = await createTestUser();
    const created = await createEntry("insight", {
      data: { title: uniqueTitle("Insight"), body: "original" },
      actorId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const draft = await getEntry("insight", created.entry.id);
    expect(draft?.publishedData).toBeNull();

    await publishEntry("insight", created.entry.id, actorId);

    const row = await getEntry("insight", created.entry.id);
    expect(row?.status).toBe("published");
    expect(row?.hasUnpublishedChanges).toBe(false);
    expect(row?.publishedData).toEqual(row?.data);
  });
});
