/**
 * Fixed-window rate limiter for the smart-search endpoint: 10 requests per
 * minute per caller.
 *
 * State lives in the process, which is what the task allows. It resets on
 * deploy and is per-instance — on a multi-instance/serverless deployment this
 * becomes a coarse abuse guard, not a hard quota. The hard cap that matters for
 * cost is the per-request timeout in `llmClient`.
 */

const WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets — for the Retry-After header. */
  retryAfterSeconds: number;
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const SMART_SEARCH_LIMIT = 10;

export function rateLimit(
  key: string,
  limit = SMART_SEARCH_LIMIT,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    prune(now);
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 60 };
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000),
  );

  if (bucket.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds };
}

/** Drops expired buckets so the Map cannot grow without bound. */
function prune(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Test helper — resets all counters. */
export function resetRateLimit(): void {
  buckets.clear();
}
