import { redirect } from "next/navigation";

import type { StaffProfile } from "@/components/admin/StaffManager";
import { OpdEligibleDoctorManager } from "@/components/opd/OpdEligibleDoctorManager";
import { Card } from "@/components/ui/Card";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { withPaginationQuery } from "@/lib/pagination";
import { hasAnyPermission } from "@/lib/rbac";

type EligibleApi = {
  userId: string;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    role: { roleName: string } | null;
  };
};

export default async function OpdManagerPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canManage = hasAnyPermission(me.permissions, ["opd:manage_doctors"]);
  if (!canManage) redirect("/dashboard/opd/queue");

  const [profilesResult, eligible] = await Promise.all([
    backendJson<{ items: StaffProfile[]; total: number }>(
      withPaginationQuery("/api/profiles", 1, 200),
    ),
    backendJson<EligibleApi[]>("/api/opd/eligible-doctors"),
  ]);

  const profiles = profilesResult?.items ?? [];
  const eligibleRows =
    eligible?.map((e) => ({
      userId: e.userId,
      isActive: e.isActive,
      user: {
        id: e.user.id,
        fullName: e.user.fullName,
        email: e.user.email,
        isActive: e.user.isActive,
        role: e.user.role ? { id: "", roleName: e.user.role.roleName } : null,
      } satisfies StaffProfile,
    })) ?? [];

  return (
    <Card title="OPD doctor eligibility" description="Choose which staff accounts may use the OPD doctor queue and pick patients.">
      {!profilesResult || !eligible ? (
        <p className="text-sm text-red-700 dark:text-red-300">Failed to load data.</p>
      ) : (
        <OpdEligibleDoctorManager profiles={profiles} eligible={eligibleRows} />
      )}
    </Card>
  );
}
