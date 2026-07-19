import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  updateEntry,
  restoreVersion,
  listVersions,
  getEntry,
} from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";


d("US4 version restore (SC-006)", () => {
  it("restores an earlier version exactly and records the restore as a new version", async () => {
    const actorId = await createTestUser();
    const firstTitle = uniqueTitle("Region A");

    const created = await createEntry("region", {
      data: { name: firstTitle, city: "London" },
      actorId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.entry.id;

    await updateEntry("region", id, {
      data: { name: uniqueTitle("Region B"), city: "Dubai" },
      actorId,
    });
    await updateEntry("region", id, {
      data: { name: uniqueTitle("Region C"), city: "Riyadh" },
      actorId,
    });

    const versionsBefore = await listVersions(id);
    expect(versionsBefore.length).toBeGreaterThanOrEqual(3);

    // Oldest version is the initial one.
    const oldest = versionsBefore[versionsBefore.length - 1];
    await restoreVersion("region", id, oldest.id, actorId);

    const entry = await getEntry("region", id);
    expect((entry!.data as { name: string }).name).toBe(firstTitle);

    const versionsAfter = await listVersions(id);
    expect(versionsAfter.length).toBe(versionsBefore.length + 1);
  });
});
