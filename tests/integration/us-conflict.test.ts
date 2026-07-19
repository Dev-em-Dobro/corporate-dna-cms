import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createEntry, updateEntry } from "@/lib/content/entries";
import { ConflictError } from "@/lib/errors";
import { createTestUser, uniqueTitle } from "../helpers/db";


d("concurrent edit conflict (T054 / CG-A5)", () => {
  it("rejects a stale expectedVersionId instead of silently overwriting", async () => {
    const actorId = await createTestUser();
    const created = await createEntry("region", {
      data: { name: uniqueTitle("Region"), city: "Singapore" },
      actorId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // A stale version id must trigger a conflict.
    await expect(
      updateEntry("region", created.entry.id, {
        data: { name: uniqueTitle("Region"), city: "Dubai" },
        expectedVersionId: crypto.randomUUID(),
        actorId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
