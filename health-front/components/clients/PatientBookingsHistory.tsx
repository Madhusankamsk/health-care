"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  formatCrewMemberName,
  formatScheduled,
} from "@/components/dispatch/dispatchDisplay";
import type { UpcomingBookingRow } from "@/components/dispatch/types";
import { toast } from "@/lib/toast";

type PatientBookingsHistoryProps = {
  bookings: UpcomingBookingRow[];
  /** `dispatch:update` — Mark arrived, Start diagnostic, Complete dispatch */
  canUpdateDispatch?: boolean;
  /** `bookings:update` — Save visit draft / remark */
  canSaveVisitDraft?: boolean;
};

type DispatchRecordRow = UpcomingBookingRow["dispatchRecords"][number];

type PendingConfirm =
  | null
  | { type: "arrived"; dispatchId: string }
  | { type: "diagnostic"; dispatchId: string }
  | { type: "complete"; dispatchId: string };

function dispatchLead(dr: DispatchRecordRow) {
  return dr.assignments.find((a) => a.isTeamLeader);
}

function dispatchOthers(dr: DispatchRecordRow) {
  return dr.assignments.filter((a) => !a.isTeamLeader);
}

function inTransitDispatchForBooking(b: UpcomingBookingRow): DispatchRecordRow | null {
  return b.dispatchRecords.find((dr) => dr.statusLookup?.lookupKey === "IN_TRANSIT") ?? null;
}

function arrivedDispatchForBooking(b: UpcomingBookingRow): DispatchRecordRow | null {
  return b.dispatchRecords.find((dr) => dr.statusLookup?.lookupKey === "ARRIVED") ?? null;
}

function diagnosticDispatchForBooking(b: UpcomingBookingRow): DispatchRecordRow | null {
  return b.dispatchRecords.find((dr) => dr.statusLookup?.lookupKey === "DIAGNOSTIC") ?? null;
}

/** Schedule & doctor, visit, and dispatch blocks (used in the card and in the details popup). */
function BookingDetailContent({
  b,
  className = "",
}: {
  b: UpcomingBookingRow;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="preview-shell sm:grid-cols-2">
        <section className="preview-section">
          <h3 className="preview-section-title">Schedule &amp; doctor</h3>
          <dl className="preview-list">
            <div className="preview-row">
              <dt className="preview-label">Scheduled</dt>
              <dd className="preview-value">{formatScheduled(b.scheduledDate)}</dd>
            </div>
            <div className="preview-row">
              <dt className="preview-label">Doctor status</dt>
              <dd className="preview-value">
                {b.doctorStatusLookup?.lookupValue ??
                  b.doctorStatusLookup?.lookupKey ??
                  "—"}
              </dd>
            </div>
            <div className="preview-row">
              <dt className="preview-label">Requested doctor</dt>
              <dd className="preview-value">{b.requestedDoctor?.fullName ?? "—"}</dd>
            </div>
            <div className="preview-row">
              <dt className="preview-label">Remark</dt>
              <dd className="preview-value">
                {b.bookingRemark?.trim() ? b.bookingRemark : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="preview-section">
          <h3 className="preview-section-title">Visit</h3>
          <dl className="preview-list">
            <div className="preview-row">
              <dt className="preview-label">Visit on file</dt>
              <dd className="preview-value">
                {b.visitRecord
                  ? b.visitRecord.completedAt
                    ? `Completed ${formatScheduled(b.visitRecord.completedAt)}`
                    : "Started (not completed)"
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Dispatching
        </p>
        {b.dispatchRecords.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            No dispatch recorded for this booking yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {b.dispatchRecords.map((dr) => {
              const l = dispatchLead(dr);
              const o = dispatchOthers(dr);
              return (
                <li
                  key={dr.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <dl className="grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-[var(--text-muted)]">Status</dt>
                      <dd className="font-medium text-[var(--text-primary)]">
                        {dr.statusLookup?.lookupValue ?? dr.statusLookup?.lookupKey ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--text-muted)]">Vehicle</dt>
                      <dd className="font-medium text-[var(--text-primary)]">
                        {dr.vehicle.vehicleNo}
                        {dr.vehicle.model?.trim() ? ` · ${dr.vehicle.model.trim()}` : ""}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-[var(--text-muted)]">Dispatched at</dt>
                      <dd>{formatScheduled(dr.dispatchedAt)}</dd>
                    </div>
                  </dl>
                  {dr.assignments.length > 0 ? (
                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)]">Crew</p>
                      <ul className="mt-2 space-y-1.5">
                        {l ? (
                          <li className="text-[var(--text-primary)]">
                            <span className="font-medium">{formatCrewMemberName(l.user)}</span>
                            <span className="text-[var(--text-muted)]"> — team leader</span>
                          </li>
                        ) : null}
                        {o.map((a) => (
                          <li key={a.id} className="text-[var(--text-secondary)]">
                            {formatCrewMemberName(a.user)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      No crew listed on this dispatch.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PatientBookingsHistory({
  bookings,
  canUpdateDispatch = false,
  canSaveVisitDraft = false,
}: PatientBookingsHistoryProps) {
  const router = useRouter();
  const [busyDispatchId, setBusyDispatchId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [remarkBookingId, setRemarkBookingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftDiagnosis, setDraftDiagnosis] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);

  async function patchDispatchStatus(
    dispatchId: string,
    statusLookupKey: "ARRIVED" | "DIAGNOSTIC" | "COMPLETED",
  ) {
    setBusyDispatchId(dispatchId);
    try {
      const res = await fetch(`/api/dispatch/${dispatchId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusLookupKey }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }
      const msg =
        statusLookupKey === "ARRIVED"
          ? "Marked as arrived."
          : statusLookupKey === "DIAGNOSTIC"
            ? "Diagnostic stage started."
            : "Visit completed.";
      toast.success(msg);
      setPendingConfirm(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyDispatchId(null);
    }
  }

  function openRemarkModal(b: UpcomingBookingRow) {
    setDraftNotes(b.visitRecord?.clinicalNotes ?? "");
    setDraftDiagnosis(b.visitRecord?.diagnosis ?? "");
    setRemarkBookingId(b.id);
  }

  const remarkBooking = remarkBookingId
    ? bookings.find((x) => x.id === remarkBookingId)
    : null;

  const detailBooking = detailBookingId
    ? bookings.find((x) => x.id === detailBookingId)
    : null;

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        No bookings recorded for this patient yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {bookings.map((b) => {
        const inTransit = inTransitDispatchForBooking(b);
        const arrived = arrivedDispatchForBooking(b);
        const diagnostic = diagnosticDispatchForBooking(b);
        const visitDone = Boolean(b.visitRecord?.completedAt);
        const inDiagnosticPhase = Boolean(diagnostic) && !visitDone;

        return (
          <article
            key={b.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {formatScheduled(b.scheduledDate)}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {b.bookingRemark?.trim() ? b.bookingRemark : "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {canUpdateDispatch && inTransit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    disabled={busyDispatchId !== null}
                    onClick={() => setPendingConfirm({ type: "arrived", dispatchId: inTransit.id })}
                  >
                    {busyDispatchId === inTransit.id ? "…" : "Mark arrived"}
                  </Button>
                ) : null}
                {canUpdateDispatch && arrived && !inTransit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    disabled={busyDispatchId !== null}
                    onClick={() =>
                      setPendingConfirm({ type: "diagnostic", dispatchId: arrived.id })
                    }
                  >
                    {busyDispatchId === arrived.id ? "…" : "Start diagnostic"}
                  </Button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-lg leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/25"
                  aria-label="View booking details"
                  aria-haspopup="dialog"
                  aria-expanded={detailBookingId === b.id}
                  onClick={() =>
                    setDetailBookingId((current) => (current === b.id ? null : b.id))
                  }
                >
                  <span aria-hidden className="block translate-y-[-1px]">
                    ⋮
                  </span>
                </button>
              </div>
            </div>

            {inDiagnosticPhase && (canUpdateDispatch || canSaveVisitDraft) ? (
              <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
                {canSaveVisitDraft ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-3 text-xs font-medium"
                    disabled={busyDispatchId !== null}
                    onClick={() => openRemarkModal(b)}
                  >
                    Remark
                  </Button>
                ) : null}
                {canUpdateDispatch ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-3 text-xs font-medium"
                      disabled={busyDispatchId !== null}
                      onClick={() =>
                        toast("Report upload will connect to your file storage (coming soon).")
                      }
                    >
                      Reports upload
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-3 text-xs font-medium"
                      disabled={busyDispatchId !== null}
                      onClick={() =>
                        toast("Lab sample collection can be linked here (coming soon).")
                      }
                    >
                      Samples
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-3 text-xs font-medium"
                      disabled={busyDispatchId !== null}
                      onClick={() =>
                        toast("Medicines for this visit can be linked here (coming soon).")
                      }
                    >
                      Medicines
                    </Button>
                    <Link
                      href="/dashboard/payments"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                    >
                      Payment
                    </Link>
                  </>
                ) : null}
                {canSaveVisitDraft ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-3 text-xs font-medium"
                    disabled={savingDraft || busyDispatchId !== null}
                    onClick={() => openRemarkModal(b)}
                  >
                    Save draft
                  </Button>
                ) : null}
                {canUpdateDispatch ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="h-8 px-3 text-xs font-medium"
                    disabled={busyDispatchId !== null}
                    onClick={() =>
                      diagnostic
                        ? setPendingConfirm({ type: "complete", dispatchId: diagnostic.id })
                        : undefined
                    }
                  >
                    Complete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}

      <ConfirmModal
        open={pendingConfirm?.type === "arrived"}
        title="Mark crew as arrived?"
        message="Confirm the team has arrived on site for this dispatch."
        confirmLabel="Yes, mark arrived"
        cancelLabel="Cancel"
        isConfirming={
          pendingConfirm?.type === "arrived" && busyDispatchId === pendingConfirm.dispatchId
        }
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (pendingConfirm?.type === "arrived") {
            void patchDispatchStatus(pendingConfirm.dispatchId, "ARRIVED");
          }
        }}
      />

      <ConfirmModal
        open={pendingConfirm?.type === "diagnostic"}
        title="Start diagnostic stage?"
        message="This opens the clinical workflow (remarks, reports, samples, payment, completion) for this visit."
        confirmLabel="Start diagnostic"
        cancelLabel="Cancel"
        isConfirming={
          pendingConfirm?.type === "diagnostic" && busyDispatchId === pendingConfirm.dispatchId
        }
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (pendingConfirm?.type === "diagnostic") {
            void patchDispatchStatus(pendingConfirm.dispatchId, "DIAGNOSTIC");
          }
        }}
      />

      <ConfirmModal
        open={pendingConfirm?.type === "complete"}
        title="Complete this visit?"
        message="This marks the dispatch completed and closes the visit. Make sure notes and billing steps are done."
        confirmLabel="Complete visit"
        cancelLabel="Cancel"
        isConfirming={
          pendingConfirm?.type === "complete" && busyDispatchId === pendingConfirm.dispatchId
        }
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (pendingConfirm?.type === "complete") {
            void patchDispatchStatus(pendingConfirm.dispatchId, "COMPLETED");
          }
        }}
      />

      <ModalShell
        open={detailBookingId !== null && detailBooking !== undefined}
        onClose={() => setDetailBookingId(null)}
        titleId="patient-booking-detail"
        title="Booking details"
        subtitle={detailBooking ? detailBooking.id : ""}
        maxWidthClass="max-w-3xl"
      >
        {detailBooking ? (
          <div className="text-sm text-[var(--text-primary)]">
            <BookingDetailContent b={detailBooking} />
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={remarkBookingId !== null && remarkBooking !== undefined}
        onClose={() => setRemarkBookingId(null)}
        titleId="patient-visit-remark"
        title="Visit remark and diagnosis"
        subtitle="Saved as a draft on the visit record."
        maxWidthClass="max-w-lg"
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--text-secondary)]">Clinical notes</span>
            <textarea
              className="min-h-[100px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--text-secondary)]">Diagnosis</span>
            <textarea
              className="min-h-[72px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
              value={draftDiagnosis}
              onChange={(e) => setDraftDiagnosis(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
            <Button type="button" variant="ghost" onClick={() => setRemarkBookingId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingDraft || !remarkBooking}
              onClick={async () => {
                if (!remarkBooking) return;
                setSavingDraft(true);
                try {
                  const res = await fetch(`/api/bookings/${remarkBooking.id}/visit-draft`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clinicalNotes: draftNotes.trim() ? draftNotes : null,
                      diagnosis: draftDiagnosis.trim() ? draftDiagnosis : null,
                    }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { message?: string };
                  if (!res.ok) throw new Error(data.message || "Save failed");
                  toast.success("Saved.");
                  setRemarkBookingId(null);
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Save failed");
                } finally {
                  setSavingDraft(false);
                }
              }}
            >
              {savingDraft ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
