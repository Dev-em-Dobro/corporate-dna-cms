import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "editor"]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "invited",
  "disabled",
]);

/** All content types the CMS manages (per data-model.md). */
export const contentTypeEnum = pgEnum("content_type", [
  "case",
  "solution",
  "person",
  "region",
  "insight",
  "page_5h",
  "page_book",
  "page_awards",
  "page_legal",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);
