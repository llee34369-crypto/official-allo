import 'server-only';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 5000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return request.headers.get('x-real-ip')?.trim() ?? 'unknown';
}

function cleanupExpiredBuckets(now: number) {
  if (rateLimitStore.size <= MAX_ENTRIES) {
    return;
  }

  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin');

  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export function takeRateLimitToken(
  request: Request,
  keyPrefix: string,
  limit: number,
  windowMs = WINDOW_MS
) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${keyPrefix}:${getClientIp(request)}`;
  const existingBucket = rateLimitStore.get(key);

  if (!existingBucket || existingBucket.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      ok: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existingBucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        Math.ceil((existingBucket.resetAt - now) / 1000),
        1
      ),
    };
  }

  existingBucket.count += 1;
  rateLimitStore.set(key, existingBucket);

  return {
    ok: true,
    remaining: Math.max(limit - existingBucket.count, 0),
    retryAfterSeconds: Math.max(
      Math.ceil((existingBucket.resetAt - now) / 1000),
      1
    ),
  };
}
