import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";

type Params = { id: string };

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const requestText = await request.text().catch(() => "");
  const res = await backendFetch(`/api/inventory/batches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" },
    body: requestText,
  });
  const bodyText = await res.text().catch(() => "");
  return new NextResponse(bodyText, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  const res = await backendFetch(`/api/inventory/batches/${id}`, { method: "DELETE" });
  const bodyText = await res.text().catch(() => "");
  return new NextResponse(bodyText, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
