import { redirect } from "next/navigation";

import { InventoryEntityManager, type InventoryEntity } from "@/components/inventory/InventoryEntityManager";
import { Card } from "@/components/ui/Card";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/rbac";

const PERMS = {
  view: ["inventory:list", "inventory:read"],
  create: ["inventory:create"],
  edit: ["inventory:update"],
  delete: ["inventory:delete"],
} as const;

export default async function InventoryMedicalItemsPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");
  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  if (!hasAnyPermission(me.permissions, [...PERMS.view])) redirect("/dashboard");
  const rows = (await backendJson<InventoryEntity[]>("/api/inventory/medical-items")) ?? [];

  return (
    <Card>
      <InventoryEntityManager
        title="Medical Items"
        endpoint="/api/inventory/medical-items"
        initialRows={rows}
        canCreate={hasAnyPermission(me.permissions, [...PERMS.create])}
        canEdit={hasAnyPermission(me.permissions, [...PERMS.edit])}
        canDelete={hasAnyPermission(me.permissions, [...PERMS.delete])}
      />
    </Card>
  );
}
