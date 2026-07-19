import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { and, eq, ne, inArray } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { updateUser, deleteUser } from "@/lib/users/service";
import { ConflictError } from "@/lib/errors";
import { deleteUsers, createPasswordUser, type TestCredentials } from "../helpers/auth";

// T053 — US4: the last active administrator cannot be removed via role
// change, via disable, OR via deletion. Deletion is a path to this failure
// that did not exist before the migration (FR-012).
d("US4 last-admin safeguard", () => {
  let target: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(target);
  });

  it("refuses role change, disable and deletion of the last active admin", async () => {
    target = await createPasswordUser("admin");

    /**
     * The safeguard counts ALL active admins, so the scenario only exists
     * when `target` is the last one. Every other active admin is parked as
     * 'disabled' for the duration of this test and restored in `finally` —
     * including on assertion failure. This touches shared dev data; it is the
     * reason vitest.config.ts runs test files sequentially.
     */
    const others = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.role, "admin"),
          eq(profiles.status, "active"),
          ne(profiles.id, target.id),
        ),
      );
    const otherIds = others.map((o) => o.id);

    try {
      if (otherIds.length > 0) {
        await db
          .update(profiles)
          .set({ status: "disabled" })
          .where(inArray(profiles.id, otherIds));
      }

      // Path 1: demotion.
      await expect(
        updateUser(target!.id, { role: "editor" }),
      ).rejects.toThrow(ConflictError);

      // Path 2: disable.
      await expect(
        updateUser(target!.id, { status: "disabled" }),
      ).rejects.toThrow(ConflictError);

      // Path 3: deletion — the new failure mode this migration introduced.
      await expect(deleteUser(target!.id)).rejects.toThrow(ConflictError);

      // The target must have survived all three attempts intact.
      const [after] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, target!.id));
      expect(after.role).toBe("admin");
      expect(after.status).toBe("active");
    } finally {
      if (otherIds.length > 0) {
        await db
          .update(profiles)
          .set({ status: "active" })
          .where(inArray(profiles.id, otherIds));
      }
    }
  });
});
