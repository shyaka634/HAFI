import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoveries } from "@/lib/db/schema";

function decodeImageDataUri(source: string) {
  const match = /^data:(image\/[a-z0-9.+-]+)(;base64)?,([\s\S]*)$/i.exec(source);
  if (!match) return null;

  const [, contentType, base64, payload] = match;
  try {
    return { contentType, body: base64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload)) };
  } catch {
    return null;
  }
}

// Serve legacy inline images as normal cacheable image responses. New uploads
// already use Cloudinary and bypass this route entirely.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [discovery] = await db
    .select({ imageBase64: discoveries.imageBase64 })
    .from(discoveries)
    .where(and(eq(discoveries.id, params.id), eq(discoveries.published, true)))
    .limit(1);

  const media = discovery ? decodeImageDataUri(discovery.imageBase64) : null;
  if (!media) return NextResponse.json({ error: "Image not found." }, { status: 404 });

  return new NextResponse(media.body, {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
