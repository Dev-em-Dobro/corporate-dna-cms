import { pgTable, uuid, text, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { roleEnum, userStatusEnum } from "./enums";

/**
 * Application-side user record. Credentials, email confirmation, MFA factors
 * and sessions all live in Supabase's `auth.users` — this table owns only what
 * the CMS itself needs.
 *
 * Named `profiles` rather than `users` deliberately: it matches Supabase's
 * documented pattern, and it sidesteps a reported `search_path` collision
 * where the auth service resolves an unqualified `users` to `public.users`.
 *
 * `id` IS the auth.users UUID — not a separate key with a reference column.
 * That keeps a single source of truth and makes any future RLS policy a plain
 * `auth.uid() = id`.
 *
 * RLS is ENABLED on this table (migration 0001) with no policies. The app
 * reaches it only through Drizzle as the owning `postgres` role, which bypasses
 * RLS; anon/authenticated (PostgREST, public key) are denied. Do NOT add a
 * permissive policy here without deliberately intending to expose the table
 * over the public REST API — that is exactly the hole 0001 closed.
 *
 * `role` and `status` are read on every guarded request rather than carried in
 * the JWT. Supabase cannot revoke a live access token, so a JWT-borne role or
 * status would stay stale for up to a full token lifetime after an admin
 * demotes or disables someone.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    role: roleEnum("role").notNull().default("editor"),
    status: userStatusEnum("status").notNull().default("invited"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.id],
      foreignColumns: [authUsers.id],
      name: "profiles_id_auth_users_fk",
    }).onDelete("cascade"),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
