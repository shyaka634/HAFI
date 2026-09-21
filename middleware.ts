import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";

// Better Auth owns the individual sign-in and session routes. Applying this at
// the edge protects all of them from brute-force traffic in one place.
export async function middleware(request: NextRequest) {
  const limited = await enforceRateLimit(request, "auth");
  return limited ?? NextResponse.next();
}

export const config = { matcher: ["/api/auth/:path*"] };
