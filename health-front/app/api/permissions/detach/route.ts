import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const requestText = await request.text().catch(() => "");
  const res = await backendFetch("/api/permissions/detach", {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
    body: requestText,
  }).catch((error) => {
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error ? error.message : "Failed to reach backend service",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const bodyText = await res.text().catch(() => "");
  return new NextResponse(bodyText, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

