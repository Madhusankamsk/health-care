"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/toast";

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
  /** Default PAYMENT_PURPOSE id from plan type (Individual / Family / Corporate). */
  suggestedPaymentPurposeId: string;
};

type LookupOption = { id: string; lookupKey: string; lookupValue: string };

type Props = {
  initialInvoices: OutstandingSubscriptionInvoiceRow[];
  paymentMethods: LookupOption[];
  paymentPurposes: LookupOption[];
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function RecordSubscriptionPaymentSection({
  initialInvoices,
  paymentMethods,
  paymentPurposes,
}: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [invoiceId, setInvoiceId] = useState(initialInvoices[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [paymentPurposeId, setPaymentPurposeId] = useState(
    () => initialInvoices[0]?.suggestedPaymentPurposeId ?? "",
  );
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const inv = invoices.find((r) => r.id === invoiceId);
    if (inv?.suggestedPaymentPurposeId) {
      setPaymentPurposeId(inv.suggestedPaymentPurposeId);
    }
  }, [invoiceId, invoices]);

  const selected = useMemo(
    () => invoices.find((r) => r.id === invoiceId) ?? null,
    [invoices, invoiceId],
  );

  const refreshInvoices = useCallback(async () => {
    const res = await fetch("/api/subscription-invoices/outstanding", { cache: "no-store" });
    if (!res.ok) {
      toast.error("Could not refresh invoice list");
      return;
    }
    const next = (await res.json()) as OutstandingSubscriptionInvoiceRow[];
    setInvoices(next);
    if (next.length && !next.some((r) => r.id === invoiceId)) {
      setInvoiceId(next[0].id);
    }
    if (next.length === 0) {
      setInvoiceId("");
    }
  }, [invoiceId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId.trim()) {
      toast.error("Select an invoice");
      return;
    }
    if (!paymentMethodId.trim()) {
      toast.error("Select a payment method");
      return;
    }
    if (!paymentPurposeId.trim()) {
      toast.error("Select a payment purpose");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/subscription-invoices/${encodeURIComponent(invoiceId)}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: amount.trim(),
          paymentMethodId: paymentMethodId.trim(),
          paymentPurposeId: paymentPurposeId.trim(),
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
      setAmount("");
      setTransactionRef("");
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

  if (paymentPurposes.length === 0) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200">
        No payment purposes are configured (PAYMENT_PURPOSE lookups). Run the database seed or add
        lookups before recording payments.
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
    <div className="flex flex-col gap-8">
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
              <th className="pb-2 font-medium">Balance</th>
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
                <td className="py-2 align-top tabular-nums font-medium">{row.balanceDue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="grid max-w-xl gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Invoice</span>
          <select
            className={selectClass}
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            required
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.accountName ?? inv.id.slice(0, 8)} — balance {inv.balanceDue}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <p className="text-xs text-[var(--text-secondary)]">
            Balance due for this invoice: <span className="tabular-nums">{selected.balanceDue}</span>
          </p>
        ) : null}
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Payment purpose</span>
          <select
            className={selectClass}
            value={paymentPurposeId}
            onChange={(e) => setPaymentPurposeId(e.target.value)}
            required
          >
            <option value="">Select</option>
            {paymentPurposes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.lookupValue}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--text-secondary)]">
            Defaults from the subscription plan type; change if this payment is for a different reason.
          </span>
        </label>
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
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="create" isLoading={submitting}>
            Record payment
          </Button>
          <Button type="button" variant="secondary" disabled={submitting} onClick={() => void refreshInvoices()}>
            Refresh list
          </Button>
        </div>
      </form>
    </div>
  );
}
