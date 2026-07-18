import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { roleEnum, userStatusEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull().default("editor"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  totpSecret: text("totp_secret"),
  status: userStatusEnum("status").notNull().default("invited"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
