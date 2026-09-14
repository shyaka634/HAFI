import { z } from "zod";
import { isRwandaDistrict, isRwandaProvince } from "@/lib/rwanda";
import { SERVICE_CATEGORIES } from "@/lib/types";

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();

const MAX_LOCAL_MEDIA_LENGTH = 12_000_000;
const MAX_SERVICE_PHOTO_LENGTH = 3_000_000;
const localImagePattern = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const localVideoPattern = /^data:video\/(mp4|webm|ogg);base64,[A-Za-z0-9+/=]+$/;

function isSafeDiscoveryMediaSource(value: string) {
  if (localImagePattern.test(value) || localVideoPattern.test(value)) return value.length <= MAX_LOCAL_MEDIA_LENGTH;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const discoveryMediaSourceSchema = z.string().trim().min(1).refine(
  isSafeDiscoveryMediaSource,
  "Use an http(s) image or video URL, or a PNG, JPEG, WebP, GIF, MP4, WebM, or Ogg file within the upload limit.",
);

export const serviceSearchSchema = z.object({
  name: z.string().trim().max(120).optional(),
  category: z.enum(SERVICE_CATEGORIES).optional(),
  district: z.string().trim().refine((value) => !value || isRwandaDistrict(value), "Choose a valid district.").optional(),
  lat: z.coerce.number().min(-2.95).max(-1).optional(),
  lng: z.coerce.number().min(28.8).max(30.9).optional(),
  nearby: z.enum(["true"]).optional(),
});

export const submissionSchema = z.object({
  type: z.enum(["CREATE", "LOCATION_CHANGE"]),
  // The form sends an empty string for this hidden field on a new-service
  // submission. Treat it as absent; it is required only for a location change.
  targetServiceId: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  name: requiredText(120),
  category: z.enum(SERVICE_CATEGORIES),
  district: z.string().refine(isRwandaDistrict, "Choose a valid district."),
  sector: optionalText(100),
  address: optionalText(240),
  phone: optionalText(30),
  photoBase64: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().trim().refine(
      (value) => localImagePattern.test(value) && value.length <= MAX_SERVICE_PHOTO_LENGTH,
      "Choose a PNG, JPEG, WebP, or GIF image smaller than 2 MB.",
    ).optional(),
  ),
  latitude: z.number().min(-2.95).max(-1),
  longitude: z.number().min(28.8).max(30.9),
  notes: optionalText(1000),
}).refine((data) => data.type !== "LOCATION_CHANGE" || Boolean(data.targetServiceId), {
  path: ["targetServiceId"],
  message: "Choose the official service that moved.",
}).refine((data) => data.type === "LOCATION_CHANGE" || Boolean(data.photoBase64), {
  path: ["photoBase64"],
  message: "Add a photo of this place.",
});

export const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: optionalText(1000),
});

const staffAssignmentFields = {
  role: z.enum(["USER", "AGENT", "PROVINCE_MANAGER"]),
  district: z.string().optional(),
  province: z.string().optional(),
};

function validateStaffAssignment(
  data: { role: "USER" | "AGENT" | "PROVINCE_MANAGER" | "SUPER_ADMIN"; district?: string; province?: string },
  context: z.RefinementCtx,
) {
  if (data.role === "AGENT" && !isRwandaDistrict(data.district ?? "")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["district"], message: "An agent needs a valid district." });
  }
  if (data.role === "PROVINCE_MANAGER" && !isRwandaProvince(data.province ?? "")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["province"], message: "A manager needs a valid province." });
  }
}

export const staffAssignmentSchema = z.object(staffAssignmentFields).superRefine(validateStaffAssignment);

const staffCreationFields = {
  ...staffAssignmentFields,
  role: z.enum(["USER", "AGENT", "PROVINCE_MANAGER", "SUPER_ADMIN"]),
};

export const staffCreationSchema = z.object({
  name: requiredText(100),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(128),
  ...staffCreationFields,
}).superRefine(validateStaffAssignment);
