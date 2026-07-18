import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { webhookEndpoints } from "@/db/schema";

export interface RevalidationEvent {
  event: "entry.published" | "entry.unpublished";
  type: string;
  slug: string;
  locale: string;
  at: string; // ISO timestamp
}

/**
 * Fire a signed revalidation webhook to every active endpoint subscribed to the
 * event (D7 / FR-021). Best-effort: failures are swallowed per-endpoint so a
 * publish is never blocked by a slow/broken consumer.
 */
export async function dispatchRevalidation(
  ev: RevalidationEvent,
): Promise<void> {
  let endpoints;
  try {
    endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.active, true));
  } catch (e) {
    console.error("[webhooks] could not load endpoints:", e);
    return;
  }

  const body = JSON.stringify(ev);
  await Promise.allSettled(
    endpoints
      .filter((e) => e.events.length === 0 || e.events.includes(ev.event))
      .map((e) => {
        const signature = createHmac("sha256", e.secret)
          .update(body)
          .digest("hex");
        return fetch(e.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-cms-signature": signature,
          },
          body,
        });
      }),
  );
}
