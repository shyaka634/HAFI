export const SERVICE_CATEGORIES = [
  "HOSPITAL",
  "PHARMACY",
  "RESTAURANT",
  "GARAGE",
  "HOTEL",
  "SCHOOL",
  "BANK",
  "SHOP",
  "MARKET",
] as const;

export type BuiltInServiceCategory = (typeof SERVICE_CATEGORIES)[number];
// Super administrators can add further values to the PostgreSQL category enum.
// Keep this type open so newly-created categories can flow through the app.
export type ServiceCategory = string;
export type UserRole = "USER" | "AGENT" | "PROVINCE_MANAGER" | "SUPER_ADMIN";
export type SubmissionType = "CREATE" | "LOCATION_CHANGE";
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  province: string | null;
  district: string | null;
};
