import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Supabase manages the `auth` schema. We reference `auth.users.id` from our
// own `users` table instead of duplicating password/session handling.
const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "instructor",
  "parent",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "standard",
  "partial",
  "exempt",
]);

export const photoStatusEnum = pgEnum("photo_status", [
  "full",
  "masked",
  "none",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "transfer",
  "card",
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "draft",
  "published",
  "withdrawn",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_reminder",
  "expiry_reminder",
  "feedback_published",
  "feedback_reply",
  "custom",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "sent",
  "failed",
]);

export const workshopFrequencyEnum = pgEnum("workshop_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "none",
]);

// --- users -----------------------------------------------------------------
// One row per authenticated person, keyed to auth.users(id). A trigger
// (see migrations/0001_rls_policies.sql) creates this row automatically on
// signup with role='parent'; an admin account's role is set manually once.
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("parent"),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- workshops -----------------------------------------------------------
// An atelier is both the schedule and the group of children — there is no
// separate "grupă" entity. See PLAN.md "Terminologie".
export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  pricePerSession: numeric("price_per_session", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  dropInPrice: numeric("drop_in_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  color: text("color"),
  frequency: workshopFrequencyEnum("frequency").notNull().default("weekly"),
  weekday: integer("weekday"), // 1-7
  startTime: time("start_time"),
  durationMin: integer("duration_min"), // informativ, nu intră în niciun calcul
  monthWeek: integer("month_week"), // doar pentru frequency='monthly'
  sessionsPerMonth: integer("sessions_per_month"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// --- children ----------------------------------------------------------
export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: date("birth_date"),
  enrolledAt: date("enrolled_at").notNull().defaultNow(),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("standard"),
  paymentStatusNote: text("payment_status_note"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
});

// --- child_workshops (link table) ---------------------------------------
// A child can attend more than one workshop ("10-12 Marți" and "10-12
// Joi" can both exist). is_primary marks the one shown in lists.
export const childWorkshops = pgTable(
  "child_workshops",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
    joinedAt: date("joined_at"),
    leftAt: date("left_at"),
  },
  (table) => [primaryKey({ columns: [table.childId, table.workshopId] })],
);

// --- parent_child (link table) -----------------------------------------
export const parentChild = pgTable(
  "parent_child",
  {
    parentUserId: uuid("parent_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    relationship: text("relationship"),
    isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.parentUserId, table.childId] })],
);

// --- consents (GDPR) -----------------------------------------------------
export const consents = pgTable("consents", {
  childId: uuid("child_id")
    .primaryKey()
    .references(() => children.id, { onDelete: "cascade" }),
  photoStatus: photoStatusEnum("photo_status").notNull().default("none"),
  tagParentSocial: boolean("tag_parent_social").notNull().default(false),
  gdprSignedAt: date("gdpr_signed_at"),
  signedByParentId: uuid("signed_by_parent_id").references(() => users.id),
  paperReference: text("paper_reference"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id),
});

// --- session_types ---------------------------------------------------------
export const sessionTypes = pgTable("session_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  suggestedSessionsUsed: numeric("suggested_sessions_used", {
    precision: 6,
    scale: 2,
  }),
  countsInStats: boolean("counts_in_stats").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
});

// --- sessions ------------------------------------------------------------
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionTypeId: uuid("session_type_id")
    .notNull()
    .references(() => sessionTypes.id),
  workshopId: uuid("workshop_id").references(() => workshops.id),
  title: text("title"),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  sessionsUsedDefault: numeric("sessions_used_default", {
    precision: 6,
    scale: 2,
  })
    .notNull()
    .default("1"),
  topic: text("topic"),
  instructorId: uuid("instructor_id").references(() => users.id),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  capacity: integer("capacity"),
  notes: text("notes"),
});

// --- session_participants (manual roster additions) -----------------------
export const sessionParticipants = pgTable(
  "session_participants",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    addedBy: uuid("added_by").references(() => users.id),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.childId] })],
);

// --- subscriptions ---------------------------------------------------------
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalCredits: numeric("total_credits", { precision: 6, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  priceNote: text("price_note"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- attendance --------------------------------------------------------
// The source of truth for subscription balances: never a decrementing
// counter, always summed from here. See PLAN.md section 3.
export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull(),
    sessionsUsed: numeric("sessions_used", { precision: 6, scale: 2 })
      .notNull()
      .default("0"),
    subscriptionId: uuid("subscription_id").references(
      () => subscriptions.id,
    ),
    isDropIn: boolean("is_drop_in").notNull().default(false),
    markedBy: uuid("marked_by").references(() => users.id),
    markedAt: timestamp("marked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    unique("attendance_session_child_unique").on(
      table.sessionId,
      table.childId,
    ),
  ],
);

// --- payments ------------------------------------------------------------
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paidAt: date("paid_at").notNull(),
  method: paymentMethodEnum("method"),
  note: text("note"),
  recordedBy: uuid("recorded_by")
    .notNull()
    .references(() => users.id),
});

// --- feedback ------------------------------------------------------------
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => sessions.id),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  status: feedbackStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  emailScheduledFor: timestamp("email_scheduled_for", { withTimezone: true }),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  withdrawnBy: uuid("withdrawn_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- feedback_versions -----------------------------------------------------
export const feedbackVersions = pgTable("feedback_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  editedBy: uuid("edited_by")
    .notNull()
    .references(() => users.id),
  editedAt: timestamp("edited_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- feedback_replies --------------------------------------------------
export const feedbackReplies = pgTable("feedback_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- notifications_log -------------------------------------------------
export const notificationsLog = pgTable("notifications_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  recipientParentId: uuid("recipient_parent_id")
    .notNull()
    .references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull().default("email"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentBy: uuid("sent_by")
    .notNull()
    .references(() => users.id),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  status: notificationStatusEnum("status").notNull().default("sent"),
});

// --- audit_log -----------------------------------------------------------
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
