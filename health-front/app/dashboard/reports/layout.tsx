import { redirect } from "next/navigation";

import { ReportsTabs } from "@/components/reports/ReportsTabs";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { getIsAuthenticated } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/adminAccess";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";
import { REPORTS_PERMS } from "@/lib/reportsPermissions";

export default async function ReportsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  if (!canAccessAdmin(me.user.role, me.permissions)) redirect("/dashboard");
  if (!hasAnyPermission(me.permissions, [...REPORTS_PERMS.module])) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-2">
      <SectionIntro title="Reports" tag="Analytics" tagTone="info" />
      <ReportsTabs />
      {children}
    </div>
  );
}
