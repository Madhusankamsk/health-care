"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/toast";
import { useEscapeKey } from "@/lib/useEscapeKey";

export type OutstandingSubscriptionInvoiceRow = {
  id: string;
  createdAt: string;
  balanceDue: string;
  totalAmount: string;
  paidAmount: string;
  subscriptionAccountId: string;
  accountName: string | null;
  planName: string;
  patientName: string | null;
  /** PAYMENT_PURPOSE id for this invoice (fixed from plan type; server applies on submit). */
  suggestedPaymentPurposeId: string;
  suggestedPaymentPurposeLabel: string;
};

type LookupOption = { id: string; lookupKey: string; lookupValue: string };

type Props = {
  initialInvoices: OutstandingSubscriptionInvoiceRow[];
  paymentMethods: LookupOption[];
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function RecordSubscriptionPaymentSection({
  initialInvoices,
  paymentMethods,
}: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const payRow = payInvoiceId ? (invoices.find((r) => r.id === payInvoiceId) ?? null) : null;

  useEscapeKey(
    () => setPayInvoiceId(null),
    payInvoiceId !== null,
  );

  const refreshInvoices = useCallback(async () => {
    const res = await fetch("/api/subscription-invoices/outstanding", { cache: "no-store" });
    if (!res.ok) {
      toast.error("Could not refresh invoice list");
      return;
    }
    const next = (await res.json()) as OutstandingSubscriptionInvoiceRow[];
    setInvoices(next);
    if (payInvoiceId && !next.some((r) => r.id === payInvoiceId)) {
      setPayInvoiceId(null);
    }
  }, [payInvoiceId]);

  function openPayModal(row: OutstandingSubscriptionInvoiceRow) {
    setPayInvoiceId(row.id);
    setAmount(row.balanceDue);
    setPaymentMethodId(paymentMethods[0]?.id ?? "");
    setTransactionRef("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payInvoiceId) return;
    if (!paymentMethodId.trim()) {
      toast.error("Select a payment method");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/subscription-invoices/${encodeURIComponent(payInvoiceId)}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: amount.trim(),
          paymentMethodId: paymentMethodId.trim(),
          transactionRef: transactionRef.trim() || undefined,
        }),
      });
      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = raw || "Payment failed";
        try {
          const j = JSON.parse(raw) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          /* keep raw */
        }
        throw new Error(msg);
      }
      toast.success("Payment recorded");
      setPayInvoiceId(null);
      await refreshInvoices();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/25";

  if (invoices.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        No subscription invoices with a balance due. New registrations create invoices here; record
        payments when money is collected.
      </p>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          No payment methods are available (PAYMENT_METHOD lookups). Configure them before recording
          payments.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="pb-2 pr-4 font-medium">Created</th>
                <th className="pb-2 pr-4 font-medium">Account</th>
                <th className="pb-2 pr-4 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)]/60 text-[var(--text-primary)] last:border-0"
                >
                  <td className="py-2 pr-4 align-top">{formatDate(row.createdAt)}</td>
                  <td className="py-2 pr-4 align-top">{row.accountName ?? "—"}</td>
                  <td className="py-2 align-top tabular-nums">{row.balanceDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void refreshInvoices()}
        >
          Refresh list
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="pb-2 pr-4 font-medium">Created</th>
              <th className="pb-2 pr-4 font-medium">Account</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Patient</th>
              <th className="pb-2 pr-4 font-medium">Total</th>
              <th className="pb-2 pr-4 font-medium">Paid</th>
              <th className="pb-2 pr-4 font-medium">Balance</th>
              <th className="pb-2 pr-2 font-medium text-right">Pay</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--border)]/60 text-[var(--text-primary)] last:border-0"
              >
                <td className="py-2 pr-4 align-top">{formatDate(row.createdAt)}</td>
                <td className="py-2 pr-4 align-top">{row.accountName ?? "—"}</td>
                <td className="py-2 pr-4 align-top">{row.planName}</td>
                <td className="py-2 pr-4 align-top">{row.patientName ?? "—"}</td>
                <td className="py-2 pr-4 align-top tabular-nums">{row.totalAmount}</td>
                <td className="py-2 pr-4 align-top tabular-nums">{row.paidAmount}</td>
                <td className="py-2 pr-4 align-top tabular-nums font-medium">{row.balanceDue}</td>
                <td className="py-2 pl-2 text-right align-top">
                  <Button
                    type="button"
                    variant="create"
                    className="h-9 px-3 text-xs"
                    onClick={() => openPayModal(row)}
                  >
                    Pay
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payRow ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-invoice-title"
          onClick={() => setPayInvoiceId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="pay-invoice-title"
                    className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
                  >
                    Record payment
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {payRow.accountName ?? "Subscription"} — balance{" "}
                    <span className="tabular-nums font-medium text-[var(--text-primary)]">
                      {payRow.balanceDue}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => setPayInvoiceId(null)}
                >
                  ×
                </button>
              </div>

              <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2 text-xs text-[var(--text-secondary)]">
                <div className="grid gap-1 sm:grid-cols-2">
                  <span>
                    <span className="text-[var(--text-muted)]">Plan:</span> {payRow.planName}
                  </span>
                  <span>
                    <span className="text-[var(--text-muted)]">Patient:</span>{" "}
                    {payRow.patientName ?? "—"}
                  </span>
                  <span className="sm:col-span-2">
                    <span className="text-[var(--text-muted)]">Balance due:</span>{" "}
                    <span className="tabular-nums font-medium text-[var(--text-primary)]">
                      {payRow.balanceDue}
                    </span>
                  </span>
                  <span className="sm:col-span-2">
                    <span className="text-[var(--text-muted)]">Payment purpose:</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {payRow.suggestedPaymentPurposeLabel}
                    </span>
                  </span>
                </div>
              </div>

              <form className="grid gap-4" onSubmit={onSubmit}>
                <Input
                  label="Amount"
                  name="amountPaid"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">Payment method</span>
                  <select
                    className={selectClass}
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.lookupValue}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Reference (optional)"
                  name="transactionRef"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={submitting}
                    onClick={() => setPayInvoiceId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="create" isLoading={submitting}>
                    Record payment
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
