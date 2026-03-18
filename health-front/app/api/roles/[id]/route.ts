import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";

type Params = { id: string };

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const res = await backendFetch(`/api/roles/${id}`, {
    method: "DELETE",
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

