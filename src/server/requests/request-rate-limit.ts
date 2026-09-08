import { createHmac } from "node:crypto";
import { getPrismaClient } from "@/server/db/prisma";
import { RateLimitError } from "@/server/security/request-guards";

export async function enforcePersistentRequestLimit(identifier: string, limit: number, windowMs: number) {
  const secret = process.env.REQUEST_RATE_LIMIT_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Request rate limit is not configured.");
  const key = createHmac("sha256", secret).update(identifier).digest("hex");
  const prisma = getPrismaClient();
  const accepted = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO public.request_rate_limits (key, count, reset_at)
    VALUES (${key}, 1, now() + ${windowMs} * interval '1 millisecond')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN request_rate_limits.reset_at <= now() THEN 1 ELSE request_rate_limits.count + 1 END,
      reset_at = CASE WHEN request_rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE request_rate_limits.reset_at END
    WHERE request_rate_limits.reset_at <= now() OR request_rate_limits.count < ${limit}
    RETURNING count`;
  if (!accepted.length) throw new RateLimitError();
  await prisma.requestRateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
