import { redirect } from "next/navigation";

import { ReportsPanel } from "@/components/reports/ReportsPanel";
import { getIsAuthenticated } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/adminAccess";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";
import { REPORTS_PERMS } from "@/lib/reportsPermissions";

export default async function ReportsFinancialPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");
  if (!canAccessAdmin(me.user.role, me.permissions)) redirect("/dashboard");
  if (!hasAnyPermission(me.permissions, [...REPORTS_PERMS.financial])) redirect("/dashboard/reports");

  return <ReportsPanel kind="financial" />;
}
