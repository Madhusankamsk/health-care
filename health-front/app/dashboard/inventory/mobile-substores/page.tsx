import { redirect } from "next/navigation";

import { MobileSubstoreManager } from "@/components/inventory/MobileSubstoreManager";
import { Card } from "@/components/ui/Card";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/rbac";

type SubstoreRow = {
  user: { id: string; fullName: string; email: string };
  totalQuantity: number;
  batches: Array<{ id: string; quantity: number; medicine: { name: string } }>;
};
type UserOption = { id: string; fullName: string; isActive: boolean };
type BatchOption = { id: string; batchNo: string; medicine: { name: string } };

const VIEW_PERMS = ["inventory:list", "inventory:substores:manage"] as const;

export default async function InventoryMobileSubstoresPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");
  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");
  if (!hasAnyPermission(me.permissions, [...VIEW_PERMS])) redirect("/dashboard");

  const [rows, users, batches] = await Promise.all([
    backendJson<SubstoreRow[]>("/api/inventory/mobile-substores"),
    backendJson<UserOption[]>("/api/profiles"),
    backendJson<BatchOption[]>("/api/inventory/batches"),
  ]);

  return (
    <Card>
      <MobileSubstoreManager
        initialRows={rows ?? []}
        users={(users ?? []).filter((u) => u.isActive).map((u) => ({ id: u.id, fullName: u.fullName }))}
        batches={batches ?? []}
      />
    </Card>
  );
}
