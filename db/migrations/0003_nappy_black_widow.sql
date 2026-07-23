ALTER TABLE "content_entries" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "content_type_sort_idx" ON "content_entries" USING btree ("type","sort_order");