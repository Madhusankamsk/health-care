"use client";

import { useEffect, useState } from "react";

import { safeFileKeySegment } from "@/components/clients/patient-bookings/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ModalShell } from "@/components/ui/ModalShell";
import { uploadFileApi } from "@/lib/patientBookingsApi";
import { toast } from "@/lib/toast";

import type { OutstandingVisitInvoiceRow } from "./visitInvoiceTypes";

const MAX_PAY_SLIP_BYTES = 5 * 1024 * 1024;

type LookupOption = { id: string; lookupKey: string; lookupValue: string };

type Props = {
  open: boolean;
  invoice: OutstandingVisitInvoiceRow | null;
  paymentMethods: LookupOption[];
  onClose: () => void;
  onRecorded: () => void | Promise<void>;
};

export function RecordVisitPaymentModal({
  open,
  invoice,
  paymentMethods,
  onClose,
  onRecorded,
}: Props) {
  const [amount, setAmount] = useState(() => invoice?.balanceDue ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(
    () => paymentMethods[0]?.id ?? "",
  );
  const [transactionRef, setTransactionRef] = useState("");
  const [paySlipFile, setPaySlipFile] = useState<File | null>(null);
  const [paySlipPreview, setPaySlipPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;
    setAmount(invoice.balanceDue);
    setPaymentMethodId(paymentMethods[0]?.id ?? "");
    setTransactionRef("");
    setPaySlipFile(null);
  }, [open, invoice?.id, paymentMethods]);

  useEffect(() => {
    if (!paySlipFile) {
      setPaySlipPreview(null);
      return;
    }
    const url = URL.createObjectURL(paySlipFile);
    setPaySlipPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [paySlipFile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    if (!paymentMethodId.trim()) {
      toast.error("Select a payment method");
      return;
    }
    if (paySlipFile && paySlipFile.size > MAX_PAY_SLIP_BYTES) {
      toast.error("Pay slip image must be 5 MB or smaller.");
      return;
    }
    setSubmitting(true);
    try {
      let paySlipUrl: string | undefined;
      if (paySlipFile) {
        const key = `payment-slips/visit-invoices/${invoice.id}/${crypto.randomUUID()}-${safeFileKeySegment(paySlipFile.name)}`;
        paySlipUrl = await uploadFileApi(paySlipFile, key);
      }
      const res = await fetch(`/api/visit-invoices/${encodeURIComponent(invoice.id)}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: amount.trim(),
          paymentMethodId: paymentMethodId.trim(),
          transactionRef: transactionRef.trim() || undefined,
          ...(paySlipUrl ? { paySlipUrl } : {}),
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
      onClose();
      await onRecorded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/25";

  const isOpen = open && invoice !== null;

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      titleId="pay-visit-invoice-title"
      title="Record visit payment"
      subtitle={
        invoice
          ? `${invoice.patientName ?? "Patient"} — balance ${invoice.balanceDue}`
          : ""
      }
      maxWidthClass="max-w-lg"
    >
      {invoice ? (
        <>
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2 text-xs text-[var(--text-secondary)]">
            <div className="grid gap-1 sm:grid-cols-2">
              <span className="sm:col-span-2">
                <span className="text-[var(--text-muted)]">Patient:</span>{" "}
                {invoice.patientName ?? "—"}
              </span>
              <span>
                <span className="text-[var(--text-muted)]">Booking:</span>{" "}
                <span className="font-mono">{invoice.bookingId.slice(0, 8)}…</span>
              </span>
              <span>
                <span className="text-[var(--text-muted)]">Scheduled:</span>{" "}
                {invoice.bookingScheduledDate
                  ? new Date(invoice.bookingScheduledDate).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </span>
              <span className="sm:col-span-2">
                <span className="text-[var(--text-muted)]">Balance due:</span>{" "}
                <span className="tabular-nums font-medium text-[var(--text-primary)]">
                  {invoice.balanceDue}
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
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Pay slip (optional)
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Upload a photo of a bank transfer receipt or cheque — JPG, PNG, or WebP, max 5 MB.
              </p>
              <input
                type="file"
                accept="image/*"
                className="text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--surface-2)] file:px-3 file:py-1.5 file:text-xs"
                onChange={(e) => setPaySlipFile(e.target.files?.[0] ?? null)}
              />
              {paySlipPreview ? (
                <div className="mt-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paySlipPreview}
                    alt="Pay slip preview"
                    className="mx-auto max-h-48 w-auto max-w-full object-contain"
                  />
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="create" isLoading={submitting}>
                Record payment
              </Button>
            </div>
          </form>
        </>
      ) : null}
    </ModalShell>
  );
}
