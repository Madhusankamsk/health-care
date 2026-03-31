import { redirect } from "next/navigation";

import {
  SubscriptionPlanManager,
  type SubscriptionPlan,
} from "@/components/admin/SubscriptionPlanManager";
import { Card } from "@/components/ui/Card";
import { canAccessAdmin } from "@/lib/adminAccess";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";

type PlanTypeOption = { id: string; lookupKey: string; lookupValue: string };

const PERMS = {
  view: ["profiles:list", "profiles:read"],
  create: ["profiles:create"],
  edit: ["profiles:update"],
  delete: ["profiles:delete"],
} as const;

async function getSubscriptionPlans() {
  return backendJson<SubscriptionPlan[]>("/api/subscription-plans");
}

async function getSubscriptionPlanTypes() {
  return backendJson<PlanTypeOption[]>("/api/subscription-plan-types");
}

export default async function AdminPlanSetupPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");
  if (!canAccessAdmin(me.user.role, me.permissions)) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...PERMS.view]);
  if (!canView) redirect("/dashboard");

  const canCreate = hasAnyPermission(me.permissions, [...PERMS.create]);
  const canEdit = hasAnyPermission(me.permissions, [...PERMS.edit]);
  const canDelete = hasAnyPermission(me.permissions, [...PERMS.delete]);

  const [plans, planTypes] = await Promise.all([
    getSubscriptionPlans(),
    getSubscriptionPlanTypes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        {!plans ? (
          <div className="text-sm text-red-700 dark:text-red-300">
            Failed to load subscription plans.
          </div>
        ) : !planTypes ? (
          <div className="text-sm text-red-700 dark:text-red-300">
            Failed to load subscription plan types.
          </div>
        ) : (
          <SubscriptionPlanManager
            initialPlans={plans}
            planTypes={planTypes}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </Card>
    </div>
  );
}

