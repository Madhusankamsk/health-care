import { redirect } from "next/navigation";

import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { canAccessSuperAdmin } from "@/lib/adminAccess";
import { SectionIntro } from "@/components/ui/SectionIntro";

export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  if (!canAccessSuperAdmin(me.user.role, me.permissions)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="Super Admin" tag="Privileged" tagTone="warning" />
      {children}
    </div>
  );
}

