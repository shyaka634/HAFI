import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type RateLimitPolicy = "auth" | "public" | "submission" | "media" | "admin" | "email";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

const limiters = redis ? {
  auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "5 m"), prefix: "hafi:auth", timeout: 1000, analytics: true }),
  public: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "1 m"), prefix: "hafi:public", timeout: 1000, analytics: true }),
  submission: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(12, "5 m"), prefix: "hafi:submission", timeout: 1000, analytics: true }),
  media: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "5 m"), prefix: "hafi:media", timeout: 1000, analytics: true }),
  admin: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "5 m"), prefix: "hafi:admin", timeout: 1000, analytics: true }),
  email: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "hafi:email", timeout: 1000, analytics: true }),
} satisfies Record<RateLimitPolicy, Ratelimit> : null;

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip.slice(0, 120);
}

export async function enforceRateLimit(request: Request, policy: RateLimitPolicy) {
  const limiter = limiters?.[policy];
  if (!limiter) return null;

  try {
    const result = await limiter.limit(clientIdentifier(request));
    if (result.success) return null;
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "X-RateLimit-Limit": String(result.limit), "X-RateLimit-Remaining": String(result.remaining) } },
    );
  } catch {
    // If the optional rate-limit service is temporarily unavailable, keep the
    // directory available rather than rejecting legitimate visitors.
    return null;
  }
}
