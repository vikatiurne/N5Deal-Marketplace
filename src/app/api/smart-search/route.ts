import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { parseQuery } from "@/lib/ai/smartSearch";
import { smartSearchRequestSchema } from "@/lib/ai/smartFilters";
import { rateLimit, SMART_SEARCH_LIMIT } from "@/lib/ai/rateLimit";

/**
 * POST /api/smart-search — natural language → marketplace filters.
 *
 * Body: `{ query: string }` (3–300 chars). Responds with
 * `{ filters, explanation, degraded }`; `degraded: true` means the caller
 * should treat it as a plain keyword search.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON body" },
      { status: 400 },
    );
  }

  const parsed = smartSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 },
    );
  }

  const limit = rateLimit(await callerKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many AI searches. Try again in ${limit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "X-RateLimit-Limit": String(SMART_SEARCH_LIMIT),
        },
      },
    );
  }

  const result = await parseQuery(parsed.data.query);

  return NextResponse.json(result, {
    headers: { "X-RateLimit-Remaining": String(limit.remaining) },
  });
}

/**
 * One bucket per signed-in user; anonymous visitors are bucketed by IP so the
 * limit cannot be bypassed by simply logging out.
 */
async function callerKey(request: Request): Promise<string> {
  const session = await auth();
  if (session?.user?.id) return `user:${session.user.id}`;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
  return `ip:${ip}`;
}
