import { redirect } from "next/navigation";

import { SectionIntro } from "@/components/ui/SectionIntro";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";

const BOOKINGS_VIEW_PERMS = ["bookings:list", "bookings:read"] as const;

export default async function BookingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canViewBookings = hasAnyPermission(me.permissions, [...BOOKINGS_VIEW_PERMS]);
  if (!canViewBookings) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-2">
      <SectionIntro title="Bookings" tag="Scheduling" tagTone="info" />
      {children}
    </div>
  );
}
