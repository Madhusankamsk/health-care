import { redirect } from "next/navigation";

import { PaymentsSubnav } from "@/components/nav/PaymentsSubnav";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";

const PAYMENTS_VIEW_PERMS = ["invoices:read", "patients:read", "profiles:read"] as const;

export default async function PaymentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...PAYMENTS_VIEW_PERMS]);
  if (!canView) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-2">
      <SectionIntro title="Payments" tag="Billing" tagTone="info" />
      <PaymentsSubnav />
      {children}
    </div>
  );
}
