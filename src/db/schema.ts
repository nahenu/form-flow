import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { FormDefinition } from "@/lib/forms/definition";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// ---- Better Auth tables (names and fields follow its Drizzle adapter) -------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

// ---- FormFlow -----------------------------------------------------------------

export const forms = pgTable(
  "forms",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The working copy the builder edits. */
    definition: jsonb("definition").$type<FormDefinition>().notNull(),
    /** Snapshot served to respondents. Null until first publish. */
    published: jsonb("published").$type<FormDefinition>(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Soft delete, so "Undo" after deleting is a single update. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("forms_user_idx").on(t.userId, t.updatedAt)],
);

/** First-touch attribution captured when a visitor first opens a form. */
export interface TrafficSource {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export const responses = pgTable(
  "responses",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    answers: jsonb("answers").$type<Record<string, string>>().notNull(),
    source: jsonb("source").$type<TrafficSource>().default(sql`'{}'::jsonb`).notNull(),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("responses_form_idx").on(t.formId, t.createdAt)],
);

export type EventType = "view" | "step_view" | "step_complete" | "submit";

/** Funnel events. One row per thing that happened, aggregated at read time. */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    type: text("type").$type<EventType>().notNull(),
    stepId: text("step_id"),
    durationMs: integer("duration_ms"),
    source: jsonb("source").$type<TrafficSource>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("events_form_type_idx").on(t.formId, t.type), index("events_form_visitor_idx").on(t.formId, t.visitorId)],
);

export type FormRow = typeof forms.$inferSelect;
export type ResponseRow = typeof responses.$inferSelect;
