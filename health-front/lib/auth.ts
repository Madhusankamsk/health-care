import { cookies } from "next/headers";

const authTokenCookieName = "health_front_auth_token";

export async function getIsAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(authTokenCookieName);

  return Boolean(tokenCookie?.value);
}

export function getSessionCookieName(): string {
  return authTokenCookieName;
}

/** Session cookie `Secure` flag. Over plain HTTP (typical Docker/LAN), use COOKIE_SECURE=false. */
export function getSessionCookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(authTokenCookieName)?.value ?? null;
}

