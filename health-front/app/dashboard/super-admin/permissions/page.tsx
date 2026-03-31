import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { CrudToolbar } from "@/components/ui/CrudToolbar";
import { RolePermissionMatrix } from "@/components/admin/RolePermissionMatrix";
import { CreatePermissionModal } from "@/components/forms/CreatePermissionModal";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { canAccessSuperAdmin } from "@/lib/adminAccess";
import { hasAnyPermission } from "@/lib/rbac";

type Permission = {
  id: string;
  permissionKey: string;
};

type Role = {
  id: string;
  roleName: string;
  description?: string | null;
};

const PERMS = {
  view: ["permissions:read", "permission:read", "permissions:list"],
  create: [
    "permissions:create",
    "permission:create",
    "permissions:write",
    "permission:write",
  ],
} as const;

async function getPermissions(): Promise<Permission[] | null> {
  return backendJson<Permission[]>("/api/permissions");
}

async function getRoles(): Promise<Role[] | null> {
  return backendJson<Role[]>("/api/roles?include=permissions");
}

export default async function SuperAdminPermissionsPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");
  if (!canAccessSuperAdmin(me.user.role, me.permissions)) redirect("/dashboard");
  const canViewPermissions =
    hasAnyPermission(me.permissions, [...PERMS.view]);
  if (!canViewPermissions) redirect("/dashboard");

  const canCreatePermissions =
    hasAnyPermission(me.permissions, [...PERMS.create]);

  const [permissions, roles] = await Promise.all([getPermissions(), getRoles()]);

  return (
    <div className="flex flex-col gap-6">
      {roles && roles.length > 0 && permissions && permissions.length > 0 ? (
        <Card>
          <CrudToolbar
            title="Role permission matrix"
            note="Actions are controlled by permissions."
            description="Grant or revoke permissions for each role."
          >
            {canCreatePermissions ? <CreatePermissionModal /> : null}
          </CrudToolbar>
          <RolePermissionMatrix roles={roles} permissions={permissions} />
        </Card>
      ) : null}
    </div>
  );
}

