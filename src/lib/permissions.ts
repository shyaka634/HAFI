import type { AppUser } from "@/lib/types";
import { provinceForDistrict } from "@/lib/rwanda";

export const isSuperAdmin = (user: AppUser | null) => user?.role === "SUPER_ADMIN";
export const isManager = (user: AppUser | null) => user?.role === "PROVINCE_MANAGER";
export const isAgent = (user: AppUser | null) => user?.role === "AGENT";

export function canSubmitForDistrict(user: AppUser | null, district: string) {
  return isAgent(user) && user?.district === district;
}

export function canReviewDistrict(user: AppUser | null, district: string) {
  return isSuperAdmin(user) || (isManager(user) && user?.province === provinceForDistrict(district));
}
