import { redirect } from "next/navigation";

import { InventoryBatchManager } from "@/components/inventory/InventoryBatchManager";
import { Card } from "@/components/ui/Card";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/rbac";

type MedicineOption = { id: string; name: string };
type Batch = {
  id: string;
  medicineId: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  buyingPrice: number | string;
  locationType: string;
  locationId?: string | null;
  medicine: { id: string; name: string };
};

const VIEW_PERMS = ["inventory:list", "inventory:batches:manage"] as const;

export default async function InventoryBatchesPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");
  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");
  if (!hasAnyPermission(me.permissions, [...VIEW_PERMS])) redirect("/dashboard");

  const [batches, medicines, items] = await Promise.all([
    backendJson<Batch[]>("/api/inventory/batches"),
    backendJson<MedicineOption[]>("/api/inventory/medicines"),
    backendJson<MedicineOption[]>("/api/inventory/medical-items"),
  ]);

  return (
    <Card>
      <InventoryBatchManager initialRows={batches ?? []} medicines={[...(medicines ?? []), ...(items ?? [])]} />
    </Card>
  );
}
