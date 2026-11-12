import { describe, expect, it } from "vitest";
import { eventSchema, defForType } from "../../lib/content/types";

const event = { title: "Her Leadership DNA", category: "cDNA", kind: "Open-enrolment programme", dateLabel: "January to May 2027" };

describe("event authoring", () => {
  it("allows saving after clearing an optional image", () => {
    expect(eventSchema.parse({ ...event, imageMediaId: "" }).imageMediaId).toBeUndefined();
  });
  it("passes flyer framing and featured status through the public list", () => {
    const parsed = eventSchema.parse({ ...event, imageContain: true, featured: true });
    expect(defForType("event").toListItem(parsed)).toMatchObject({ imageContain: true, featured: true, kind: event.kind });
  });
  it("requires the fields needed to render an event", () => {
    expect(eventSchema.safeParse({ title: event.title }).success).toBe(false);
  });
});
