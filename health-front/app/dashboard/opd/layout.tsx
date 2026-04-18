import { redirect } from "next/navigation";

import { OpdSubnav } from "@/components/opd/OpdSubnav";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";

const OPD_VIEW_PERMS = ["opd:list", "opd:read"] as const;

export default async function OpdLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...OPD_VIEW_PERMS]);
  if (!canView) redirect("/dashboard");

  const canManageDoctors = hasAnyPermission(me.permissions, ["opd:manage_doctors"]);
  const canPick = hasAnyPermission(me.permissions, ["opd:pick"]);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="OPD" tag="Outpatient" tagTone="info" />
      <OpdSubnav canManageDoctors={canManageDoctors} canPick={canPick} />
      {children}
    </div>
  );
}
