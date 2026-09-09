export const accessTokenCookieName = "kayart_access_token";
export const refreshTokenCookieName = "kayart_refresh_token";

export function sessionCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}

export function accessCookieLifetime(expiresIn: number) {
  return Math.max(1, Math.floor(expiresIn) - 30);
}
