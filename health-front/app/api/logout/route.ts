import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionCookieName, getSessionCookieSecure } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: getSessionCookieSecure(),
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}

