import {
  boolean,
  doublePrecision,
  index,
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
}, (table) => [
  index("Service_category_idx").on(table.category),
  index("Service_district_idx").on(table.district),
  index("Service_category_district_idx").on(table.category, table.district),
  index("Service_latitude_longitude_idx").on(table.latitude, table.longitude),
]);

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
}, (table) => [
  index("User_role_district_archived_idx").on(table.role, table.district, table.archivedAt),
  index("User_role_province_archived_idx").on(table.role, table.province, table.archivedAt),
]);

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
  // Exact Cloudinary identifiers are saved separately from the display URL so
  // a deleted banner can remove only the media Hafi uploaded for that banner.
  mediaPublicId: text("mediaPublicId"),
  mediaResourceType: text("mediaResourceType"),
  link: text("link"),
  // Existing adverts default to the side Discovery area. New adverts can be
  // assigned to the independent top-header banner by a super administrator.
  placement: text("placement").notNull().default("SIDE"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).notNull().defaultNow(),
}, (table) => [
  index("Discovery_published_placement_createdAt_idx").on(table.published, table.placement, table.createdAt),
]);

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
}, (table) => [
  index("ServiceSubmission_status_district_createdAt_idx").on(table.status, table.district, table.createdAt),
  index("ServiceSubmission_submittedBy_createdAt_idx").on(table.submittedBy, table.createdAt),
  index("ServiceSubmission_targetServiceId_idx").on(table.targetServiceId),
]);

export const auditLogs = pgTable("AuditLog", {
  id: text("id").primaryKey(),
  actorId: text("actorId"),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId"),
  details: jsonb("details"),
  createdAt: timestamp("createdAt", { withTimezone: false }).notNull().defaultNow(),
}, (table) => [
  index("AuditLog_actorId_createdAt_idx").on(table.actorId, table.createdAt),
  index("AuditLog_entityType_entityId_idx").on(table.entityType, table.entityId),
]);
