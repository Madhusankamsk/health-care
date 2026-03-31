import { redirect } from "next/navigation";

import { SectionIntro } from "@/components/ui/SectionIntro";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";

const DISPATCH_VIEW_PERMS = ["dispatch:list", "dispatch:read", "dispatch:update"] as const;

export default async function DispatchingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...DISPATCH_VIEW_PERMS]);
  if (!canView) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-2">
      <SectionIntro title="Dispatching" tag="Operations" tagTone="info" />
      {children}
    </div>
  );
}
