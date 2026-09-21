import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAgent, isSuperAdmin } from "@/lib/permissions";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const SERVICE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DISCOVERY_IMAGE_TYPES = [...SERVICE_IMAGE_TYPES, "video/mp4", "video/webm", "video/ogg"];
const MAX_SERVICE_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_DISCOVERY_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_DISCOVERY_VIDEO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "media");
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const kind = form?.get("kind");
  const file = form?.get("file");
  if ((kind !== "service" && kind !== "discovery") || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose a valid media file." }, { status: 400 });
  }
  if (kind === "service" && !isAgent(user)) return NextResponse.json({ error: "Only district agents can upload place photos." }, { status: 403 });
  if (kind === "discovery" && !isSuperAdmin(user)) return NextResponse.json({ error: "Super administrator access required." }, { status: 403 });

  const allowedTypes = kind === "service" ? SERVICE_IMAGE_TYPES : DISCOVERY_IMAGE_TYPES;
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Choose a supported image or video file." }, { status: 400 });
  const maximumBytes = file.type.startsWith("video/") ? MAX_DISCOVERY_VIDEO_BYTES : kind === "service" ? MAX_SERVICE_IMAGE_BYTES : MAX_DISCOVERY_IMAGE_BYTES;
  if (file.size > maximumBytes) return NextResponse.json({ error: `Choose a file smaller than ${maximumBytes / 1024 / 1024} MB.` }, { status: 400 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Media storage is not configured yet.", code: "MEDIA_STORAGE_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const result = await uploadToCloudinary({ buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type, kind });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The media upload could not be completed. Please try again." }, { status: 502 });
  }
}
