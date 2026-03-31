import { redirect } from "next/navigation";

import { StockMovementManager } from "@/components/inventory/StockMovementManager";
import { Card } from "@/components/ui/Card";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/rbac";

type Movement = {
  id: string;
  createdAt: string;
  quantity: number;
  fromLocationId: string;
  toLocationId: string;
  status: string;
  medicine: { name: string };
  batch: { batchNo: string };
  transferredBy: { fullName: string };
};

type BatchOption = { id: string; batchNo: string; medicine: { name: string } };

const VIEW_PERMS = ["inventory:list", "inventory:movements:manage"] as const;

export default async function InventoryStockMovementsPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");
  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");
  if (!hasAnyPermission(me.permissions, [...VIEW_PERMS])) redirect("/dashboard");

  const [rows, batches] = await Promise.all([
    backendJson<Movement[]>("/api/inventory/stock-movements"),
    backendJson<BatchOption[]>("/api/inventory/batches"),
  ]);

  return (
    <Card>
      <StockMovementManager initialRows={rows ?? []} batches={batches ?? []} />
    </Card>
  );
}
