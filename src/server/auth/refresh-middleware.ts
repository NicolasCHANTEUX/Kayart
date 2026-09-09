import { NextResponse, type NextRequest } from "next/server";
import { refreshPasswordSession } from "./supabase-auth";
import { accessTokenCookieName, refreshTokenCookieName, sessionCookieOptions, accessCookieLifetime } from "./session-cookies";

// The decoded expiry is only a scheduling hint, never an identity or role check.
// Every protected service still validates the token with Supabase /user and resolves the role in the database.
export function needsSessionRefresh(token?: string, now = Date.now()) {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp !== "number" || !Number.isFinite(exp) || exp * 1000 <= now + 60000;
  } catch { return true; }
}

export async function refreshRequestSession(request: NextRequest) {
  const accessToken = request.cookies.get(accessTokenCookieName)?.value;
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;
  const privateResponse = (response: NextResponse) => {
    if (accessToken || refreshToken) response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  if (!refreshToken || !needsSessionRefresh(accessToken)) return privateResponse(NextResponse.next());
  try {
    const session = await refreshPasswordSession(refreshToken);
    if (session) {
      request.cookies.set(accessTokenCookieName, session.accessToken);
      request.cookies.set(refreshTokenCookieName, session.refreshToken);
    } else {
      request.cookies.delete(accessTokenCookieName);
      request.cookies.delete(refreshTokenCookieName);
    }
    // Forward refreshed cookies to this request's server components/actions, as well as to the browser.
    const response = NextResponse.next({ request: { headers: request.headers } });
    response.cookies.set(accessTokenCookieName, session?.accessToken ?? "", sessionCookieOptions(session ? accessCookieLifetime(session.expiresIn) : 0));
    response.cookies.set(refreshTokenCookieName, session?.refreshToken ?? "", sessionCookieOptions(session ? 60 * 60 * 24 * 30 : 0));
    return privateResponse(response);
  } catch {
    // Leave refresh credentials intact for the next request. Protected routes still fail closed.
    console.warn("Session refresh unavailable; credentials retained for retry.");
    return privateResponse(NextResponse.next());
  }
}
