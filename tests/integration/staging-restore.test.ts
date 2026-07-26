import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
  listVersions,
  restoreVersion,
  getEntry,
} from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: restoring a version on a published entry", () => {
  it("stages the restore (flags pending) without touching the snapshot", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "v1" },
      actorId,
    });
    if (!created.ok) return;
    const id = created.entry.id;
    await publishEntry("insight", id, actorId); // publishedData.body = "v1"
    await updateEntry("insight", id, { data: { title, body: "v2" }, actorId });
    await publishEntry("insight", id, actorId); // publishedData.body = "v2"

    const versions = await listVersions(id);
    const oldest = versions[versions.length - 1];
    await restoreVersion("insight", id, oldest.id, actorId);

    const row = await getEntry("insight", id);
    expect((row?.data as { body: string }).body).toBe("v1");
    expect((row?.publishedData as { body: string }).body).toBe("v2");
    expect(row?.hasUnpublishedChanges).toBe(true);
  });
});
