import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
  getEntry,
} from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: editing a published entry", () => {
  it("freezes publishedData and flags unpublished changes", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "original" },
      actorId,
    });
    if (!created.ok) return;
    const id = created.entry.id;
    await publishEntry("insight", id, actorId);

    await updateEntry("insight", id, {
      data: { title, body: "edited" },
      actorId,
    });

    const row = await getEntry("insight", id);
    expect(row?.hasUnpublishedChanges).toBe(true);
    expect((row?.data as { body: string }).body).toBe("edited");
    expect((row?.publishedData as { body: string }).body).toBe("original");
  });
});
