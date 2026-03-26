import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";

type Params = { id: string };

function relayResponse(res: Response, bodyText: string) {
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new NextResponse(null, { status: res.status });
  }
  return new NextResponse(bodyText, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const requestText = await request.text().catch(() => "");
  const res = await backendFetch(`/api/subscription-accounts/${id}/members`, {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
    body: requestText,
  }).catch((error) => {
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to reach backend service",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  });

  const bodyText = await res.text().catch(() => "");
  return relayResponse(res, bodyText);
}

export async function DELETE(request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const requestText = await request.text().catch(() => "");
  const res = await backendFetch(`/api/subscription-accounts/${id}/members`, {
    method: "DELETE",
    headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
    body: requestText,
  }).catch((error) => {
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to reach backend service",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  });

  const bodyText = await res.text().catch(() => "");
  return relayResponse(res, bodyText);
}
