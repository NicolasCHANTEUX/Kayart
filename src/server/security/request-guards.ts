import { headers } from "next/headers";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimitError extends Error {
  constructor() {
    super("Trop de tentatives. Patientez quelques minutes avant de recommencer.");
  }
}

export class InvalidRequestOriginError extends Error {
  constructor() {
    super("Requete refusee.");
  }
}

export async function requireSameOriginAction() {
  const headerStore = await headers();
  assertSameOrigin({
    host: headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
    origin: headerStore.get("origin"),
    proto: headerStore.get("x-forwarded-proto")
  });
}

export function requireSameOriginRequest(request: Request) {
  const requestUrl = new URL(request.url);

  assertSameOrigin({
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? requestUrl.host,
    origin: request.headers.get("origin"),
    proto: request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "")
  });
}

export async function getActionClientKey(scope: string, identifier = "") {
  const headerStore = await headers();
  return buildClientKey(
    scope,
    headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? "unknown",
    identifier
  );
}

export function getRequestClientKey(request: Request, scope: string, identifier = "") {
  return buildClientKey(
    scope,
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
    identifier
  );
}

export function enforceRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    cleanupRateLimitStore(now);
    return;
  }

  if (existing.count >= limit) {
    throw new RateLimitError();
  }

  existing.count += 1;
}

function assertSameOrigin({
  host,
  origin,
  proto
}: {
  host: string | null;
  origin: string | null;
  proto: string | null;
}) {
  if (!origin) {
    return;
  }

  const allowedOrigins = getAllowedOrigins(host, proto);

  if (!allowedOrigins.has(normalizeOrigin(origin))) {
    throw new InvalidRequestOriginError();
  }
}

function getAllowedOrigins(host: string | null, proto: string | null) {
  const allowedOrigins = new Set<string>();
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

  [configuredSiteUrl, vercelUrl].forEach((value) => {
    if (value) {
      allowedOrigins.add(normalizeOrigin(value));
    }
  });

  if (host) {
    const protocol = proto === "http" || proto === "https" ? proto : "https";
    allowedOrigins.add(normalizeOrigin(`${protocol}://${host}`));
  }

  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  return allowedOrigins;
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch (error) {
    return "";
  }
}

function buildClientKey(scope: string, forwardedFor: string, identifier: string) {
  const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return [scope, clientIp, normalizedIdentifier].filter(Boolean).join(":");
}

function cleanupRateLimitStore(now: number) {
  if (rateLimitStore.size < 500) {
    return;
  }

  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}
