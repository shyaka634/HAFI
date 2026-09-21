import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

type MediaKind = "service" | "discovery";
type CloudinaryResourceType = "image" | "video";

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export function isCloudinaryConfigured() {
  return Boolean(cloudinaryConfig());
}

function configureCloudinary() {
  const config = cloudinaryConfig();
  if (!config) throw new Error("Cloudinary is not configured.");

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
  return config;
}

export async function uploadToCloudinary({ buffer, contentType, kind }: { buffer: Buffer; contentType: string; kind: MediaKind }) {
  configureCloudinary();

  const resourceType = contentType.startsWith("video/") ? "video" : "image";
  return new Promise<{ url: string; publicId: string; resourceType: "image" | "video" }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `hafi/${kind}s`,
        resource_type: resourceType,
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        quality: "auto",
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) return reject(error ?? new Error("Cloudinary did not return a media URL."));
        resolve({ url: result.secure_url, publicId: result.public_id, resourceType });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

/** Removes only a public ID which Hafi saved when it uploaded the banner. */
export async function deleteDiscoveryFromCloudinary({ publicId, resourceType }: { publicId: string; resourceType: CloudinaryResourceType }) {
  configureCloudinary();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Cloudinary did not remove the banner media.");
  }
}
