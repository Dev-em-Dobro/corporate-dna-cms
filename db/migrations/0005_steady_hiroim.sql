ALTER TABLE "content_entries" ADD COLUMN "published_data" jsonb;--> statement-breakpoint
ALTER TABLE "content_entries" ADD COLUMN "has_unpublished_changes" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "content_entries" SET "published_data" = "data" WHERE "status" = 'published';