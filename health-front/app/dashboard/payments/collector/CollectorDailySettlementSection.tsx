"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CrudToolbar } from "@/components/ui/CrudToolbar";
import { toast } from "@/lib/toast";

export type CollectorDailySummaryRow = {
  collectorId: string;
  collectorName: string;
  paymentMethodKey: string;
  paymentMethodLabel: string;
  paymentCount: number;
  totalAmount: string;
  settledAmount: string;
  pendingAmount: string;
  isSettled: boolean;
  settledAt: string | null;
  settledByName: string | null;
};

type Props = {
  initialDate: string;
  initialRows: CollectorDailySummaryRow[];
};

export function CollectorDailySettlementSection({ initialDate, initialRows }: Props) {
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState(initialRows);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settleTarget, setSettleTarget] = useState<CollectorDailySummaryRow | null>(null);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += Number(row.totalAmount) || 0;
        acc.pending += Number(row.pendingAmount) || 0;
        return acc;
      },
      { total: 0, pending: 0 },
    );
  }, [rows]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/collectors/daily?date=${encodeURIComponent(date)}`, {
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as {
        rows?: CollectorDailySummaryRow[];
        message?: string;
      };
      if (!res.ok) throw new Error(payload.message || "Failed to load collector totals");
      setRows(payload.rows ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load collector totals");
    } finally {
      setLoading(false);
    }
  }

  async function settleRow(row: CollectorDailySummaryRow) {
    const rowKey = `${row.collectorId}:${row.paymentMethodKey}`;
    setBusyKey(rowKey);
    try {
      const res = await fetch("/api/payments/collectors/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          collectorId: row.collectorId,
          paymentMethodKey: row.paymentMethodKey,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(payload.message || "Failed to settle");
      toast.success(`${row.paymentMethodLabel} settled for ${row.collectorName}`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to settle");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmModal
        open={settleTarget !== null}
        title="Settle collector total?"
        message={
          settleTarget
            ? `Settle ${settleTarget.paymentMethodLabel} for ${settleTarget.collectorName} on ${date}. Pending amount: ${settleTarget.pendingAmount}.`
            : ""
        }
        confirmLabel="Settle now"
        confirmVariant="edit"
        isConfirming={settleTarget ? busyKey === `${settleTarget.collectorId}:${settleTarget.paymentMethodKey}` : false}
        onCancel={() => {
          if (busyKey) return;
          setSettleTarget(null);
        }}
        onConfirm={() => {
          if (!settleTarget) return;
          void settleRow(settleTarget).then(() => setSettleTarget(null));
        }}
      />

      <CrudToolbar
        title="Collector daily settlement"
        description="Settle each collector's CASH and CHEQUE collections at end of day."
      >
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] sm:text-sm">
          Date
          <input
            type="date"
            value={date}
            className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 text-sm text-[var(--text-primary)]"
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <Button type="button" variant="secondary" className="h-9 px-3" onClick={() => void refresh()}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CrudToolbar>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Total collected</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{totals.total.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--warning)]">Pending settlement</p>
          <p className="text-lg font-semibold text-[var(--warning)]">{totals.pending.toFixed(2)}</p>
        </div>
      </div>

      <div className="tbl-shell overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Collector</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Collected</th>
              <th className="px-4 py-3">Settled</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No cash/cheque collections found for this day.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowKey = `${row.collectorId}:${row.paymentMethodKey}`;
                const isBusy = busyKey === rowKey;
                return (
                  <tr key={rowKey} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.collectorName}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.paymentMethodLabel}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{row.paymentCount}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-primary)]">{row.totalAmount}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{row.settledAmount}</td>
                    <td className="px-4 py-3 tabular-nums font-medium text-[var(--warning)]">
                      {row.pendingAmount}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {row.isSettled ? (
                        <span className="pill pill-success">
                          Settled{row.settledByName ? ` by ${row.settledByName}` : ""}
                        </span>
                      ) : (
                        <span className="pill pill-warning">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 px-3"
                        disabled={isBusy || Number(row.pendingAmount) <= 0}
                        onClick={() => setSettleTarget(row)}
                      >
                        {isBusy ? "Settling..." : `Settle ${row.paymentMethodKey}`}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
