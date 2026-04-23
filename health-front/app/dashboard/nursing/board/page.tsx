import type { ActiveNursingAdmissionRow } from "@/components/nursing/NursingAdmissionsBoard";
import { NursingAdmissionsBoard } from "@/components/nursing/NursingAdmissionsBoard";
import { getIsAuthenticated } from "@/lib/auth";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";

const NURSING_PERMS = {
  view: ["nursing:list", "nursing:read"],
  manage: ["nursing:manage"],
  discharge: ["nursing:discharge"],
} as const;

export default async function NursingBoardPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...NURSING_PERMS.view]);
  if (!canView) redirect("/dashboard");

  const canManage = hasAnyPermission(me.permissions, [...NURSING_PERMS.manage]);
  const canDischarge = hasAnyPermission(me.permissions, [...NURSING_PERMS.discharge]);

  const active = await backendJson<{ items: unknown[] }>("/api/nursing/admissions/active");

  const initialAdmissions =
    active && Array.isArray(active.items) ? (active.items as ActiveNursingAdmissionRow[]) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">In-house nursing</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Company premises admissions, daily notes, discharge, and starting diagnostic encounters (completed
          under the patient profile bookings list).
        </p>
      </div>
      {!active ? (
        <p className="text-sm text-red-700 dark:text-red-300">Unable to load active admissions.</p>
      ) : (
        <NursingAdmissionsBoard
          initialAdmissions={initialAdmissions}
          canManage={canManage}
          canDischarge={canDischarge}
        />
      )}
    </div>
  );
}
