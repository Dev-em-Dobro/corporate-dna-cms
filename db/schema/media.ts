import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

/** Uploaded image/document. Binaries live in Bunny.net; only metadata here. */
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  width: integer("width"),
  height: integer("height"),
  bunnyPath: text("bunny_path").notNull(),
  deliveryUrl: text("delivery_url").notNull(),
  altText: text("alt_text"),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
