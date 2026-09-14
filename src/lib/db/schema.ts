import {
  boolean,
  doublePrecision,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const serviceCategory = pgEnum("ServiceCategory", [
  "HOSPITAL", "PHARMACY", "RESTAURANT", "GARAGE", "HOTEL", "SCHOOL", "BANK", "SHOP", "MARKET",
]);
export const userRole = pgEnum("UserRole", ["USER", "AGENT", "PROVINCE_MANAGER", "SUPER_ADMIN"]);
export const submissionType = pgEnum("SubmissionType", ["CREATE", "LOCATION_CHANGE"]);
export const submissionStatus = pgEnum("SubmissionStatus", ["PENDING", "APPROVED", "REJECTED"]);

// Table names intentionally match the existing Neon database. Drizzle can use
// these tables immediately, without deleting the data created by the old MVP.
export const services = pgTable("Service", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: serviceCategory("category").notNull(),
  district: text("district").notNull(),
  sector: text("sector"),
  address: text("address"),
  phone: text("phone"),
  imageBase64: text("imageBase64"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull(),
});

export const users = pgTable("User", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("USER"),
  province: text("province"),
  district: text("district"),
  archivedAt: timestamp("archivedAt", { withTimezone: false }),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const sessions = pgTable("Session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const accounts = pgTable("Account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: false }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: false }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const verifications = pgTable("Verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const discoveries = pgTable("Discovery", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageBase64: text("imageBase64").notNull(),
  link: text("link"),
  // Existing adverts default to the side Discovery area. New adverts can be
  // assigned to the independent top-header banner by a super administrator.
  placement: text("placement").notNull().default("SIDE"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const serviceSubmissions = pgTable("ServiceSubmission", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: serviceCategory("category").notNull(),
  district: text("district").notNull(),
  sector: text("sector"),
  address: text("address"),
  phone: text("phone"),
  imageBase64: text("imageBase64"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  notes: text("notes"),
  type: submissionType("type").notNull().default("CREATE"),
  status: submissionStatus("status").notNull().default("PENDING"),
  targetServiceId: text("targetServiceId"),
  submittedBy: text("submittedBy").notNull(),
  reviewedBy: text("reviewedBy"),
  reviewedAt: timestamp("reviewedAt", { withTimezone: false }),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
});

export const auditLogs = pgTable("AuditLog", {
  id: text("id").primaryKey(),
  actorId: text("actorId"),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId"),
  details: jsonb("details"),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
});
