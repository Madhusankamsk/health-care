import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { CrudToolbar } from "@/components/ui/CrudToolbar";
import { backendJson, type BackendMeResponse } from "@/lib/backend";
import { getIsAuthenticated } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/rbac";

const VIEW_PERMS = ["invoices:read", "patients:read", "profiles:read"] as const;

export type PaymentListRow = {
  id: string;
  paidAt: string;
  amountPaid: string;
  transactionRef: string | null;
  paySlipUrl: string | null;
  paymentMethod: string;
  paymentPurpose: string | null;
  invoiceId: string;
  patientId: string | null;
  patientName: string;
  subscriptionAccountId: string | null;
  subscriptionAccountName: string | null;
  planName: string | null;
  collectedById: string;
  collectedByName: string;
};

async function getPayments() {
  return backendJson<PaymentListRow[]>("/api/payments");
}

function formatPaidAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PaymentsAccountsPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) redirect("/");

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/dashboard");

  const canView = hasAnyPermission(me.permissions, [...VIEW_PERMS]);
  if (!canView) redirect("/dashboard");

  const payments = await getPayments();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CrudToolbar
          title="Accounts"
          description="Recorded invoice payments (including subscription billing). Up to 200 most recent."
        />
        {!payments ? (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            Unable to load payments. Check permissions or try again.
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No payments yet.</p>
        ) : (
          <div className="tbl-shell overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Account / plan</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Pay slip</th>
                  <th className="px-4 py-3">Collected by</th>
                  <th className="px-4 py-3 text-right">Bill</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3 align-top">{formatPaidAt(row.paidAt)}</td>
                    <td className="px-4 py-3 align-top tabular-nums">{row.amountPaid}</td>
                    <td className="px-4 py-3 align-top">{row.paymentMethod}</td>
                    <td className="px-4 py-3 align-top">{row.paymentPurpose ?? "—"}</td>
                    <td className="px-4 py-3 align-top">{row.patientName}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        <span>{row.subscriptionAccountName ?? "—"}</span>
                        {row.planName ? (
                          <span className="text-xs text-[var(--text-secondary)]">{row.planName}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-[var(--text-secondary)]">
                      {row.transactionRef ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {row.paySlipUrl ? (
                        <a
                          className="text-[var(--brand-primary)] underline-offset-2 hover:underline"
                          href={row.paySlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">{row.collectedByName}</td>
                    <td className="px-4 py-3 text-right align-top">
                      {row.subscriptionAccountId ? (
                        <a
                          className="text-[var(--brand-primary)] underline-offset-2 hover:underline"
                          href={`/api/invoices/${encodeURIComponent(row.invoiceId)}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
