import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/rbac";

import {
  CollectorDailySettlementSection,
  type CollectorDailySummaryRow,
} from "./CollectorDailySettlementSection";

const VIEW_PERMS = ["invoices:read", "patients:read", "profiles:read"] as const;

type CollectorDailyResponse = { date: string; rows: CollectorDailySummaryRow[] };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function PaymentsCollectorPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...VIEW_PERMS]);
  if (!canView) redirect("/dashboard");

  const selectedDate = todayIsoDate();
  const summary = await backendJson<CollectorDailyResponse>(
    `/api/payments/collectors/daily?date=${encodeURIComponent(selectedDate)}`,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        {!summary ? (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            Unable to load collector settlements. Check permissions or try again.
          </div>
        ) : (
          <CollectorDailySettlementSection
            initialDate={summary.date || selectedDate}
            initialRows={summary.rows ?? []}
          />
        )}
      </Card>
    </div>
  );
}
