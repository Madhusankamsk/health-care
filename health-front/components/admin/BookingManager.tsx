"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/toast";
import { useEscapeKey } from "@/lib/useEscapeKey";

export type Booking = {
  id: string;
  patientId: string;
  scheduledDate: string | null;
  bookingRemark?: string | null;
  requestedDoctorId?: string | null;
  doctorStatusId?: string | null;
  patient?: { id: string; fullName: string } | null;
  requestedDoctor?: { id: string; fullName: string; email: string } | null;
  doctorStatusLookup?: { id: string; lookupKey: string; lookupValue: string } | null;
};

type PatientOption = { id: string; fullName: string };
export type DoctorProfileOption = { id: string; fullName: string; email: string };
export type DoctorStatusOption = { id: string; lookupKey: string; lookupValue: string };

type BookingManagerProps = {
  initialBookings: Booking[];
  patients: PatientOption[];
  doctors: DoctorProfileOption[];
  doctorStatuses: DoctorStatusOption[];
  currentUserId: string;
  scopeAll: boolean;
  canPreview: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type Mode = "none" | "create" | "edit" | "preview";

type ActionConfirm = null | { type: "edit" | "delete"; id: string };

export function BookingManager({
  initialBookings,
  patients,
  doctors,
  doctorStatuses,
  currentUserId,
  scopeAll,
  canPreview,
  canCreate,
  canEdit,
  canDelete,
}: BookingManagerProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [mode, setMode] = useState<Mode>("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionConfirm, setActionConfirm] = useState<ActionConfirm>(null);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return bookings.find((b) => b.id === selectedId) ?? null;
  }, [bookings, selectedId]);

  const useFullEdit = scopeAll;

  useEscapeKey(
    () => {
      setMode("none");
      setError(null);
    },
    (mode === "create" && canCreate) ||
      (mode === "edit" && canEdit) ||
      (mode === "preview" && canPreview),
  );

  async function refresh() {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to refresh bookings");
    const next = (await res.json()) as Booking[];
    setBookings(next);
  }

  async function performDelete(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to delete booking");
      }
      await refresh();
      toast.success("Booking deleted");
      if (selectedId === id) {
        setSelectedId(null);
        setMode("none");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function setDoctorDecision(bookingId: string, lookupKey: "ACCEPTED" | "REJECTED") {
    const row = doctorStatuses.find((d) => d.lookupKey === lookupKey);
    if (!row) {
      toast.error("Status lookup not configured");
      return;
    }
    setBusyId(bookingId);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorStatusId: row.id }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Update failed");
      }
      await refresh();
      toast.success(lookupKey === "ACCEPTED" ? "Booking accepted" : "Booking rejected");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmModal
        open={actionConfirm !== null}
        title={
          actionConfirm?.type === "delete" ? "Delete booking?" : "Edit booking?"
        }
        message={
          actionConfirm?.type === "delete"
            ? "Are you sure you want to delete this booking? This action cannot be undone."
            : "Are you sure you want to edit this booking?"
        }
        confirmLabel={actionConfirm?.type === "delete" ? "Delete" : "Continue"}
        confirmVariant={actionConfirm?.type === "delete" ? "delete" : "edit"}
        onCancel={() => setActionConfirm(null)}
        onConfirm={() => {
          if (!actionConfirm) return;
          const { type, id } = actionConfirm;
          setActionConfirm(null);
          if (type === "delete") {
            void performDelete(id);
          } else {
            setSelectedId(id);
            setMode("edit");
            setError(null);
          }
        }}
      />
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Manage bookings: requested doctor, doctor acceptance status, and booking remark.
        </div>
        <div className="flex items-center gap-2">
          {canCreate ? (
            <Button
              variant="create"
              className="h-10 px-4 text-xs sm:text-sm"
              onClick={() => {
                setMode("create");
                setSelectedId(null);
                setError(null);
              }}
            >
              Create booking
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={async () => {
              setError(null);
              try {
                await refresh();
                toast.success("Bookings refreshed");
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Something went wrong";
                setError(msg);
                toast.error(msg);
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {mode === "create" && canCreate ? (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-booking-title"
          onClick={() => {
            setMode("none");
            setError(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="create-booking-title"
                    className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
                  >
                    Create booking
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Patient is required. Requested doctor is optional; if selected it starts as Pending.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => {
                    setMode("none");
                    setError(null);
                  }}
                >
                  ×
                </button>
              </div>
              <BookingForm
                layout="modal"
                intent="create"
                title="Create booking"
                submitLabel="Create"
                patients={patients}
                doctors={doctors}
                onCancel={() => {
                  setMode("none");
                  setError(null);
                }}
                onSubmit={async (values) => {
                  setError(null);
                  const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                  });
                  if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    throw new Error(msg || "Create failed");
                  }
                  await refresh();
                  setMode("none");
                  toast.success("Booking created");
                }}
              />
            </Card>
          </div>
        </div>
      ) : null}

      {mode === "edit" && selected ? (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-booking-title"
          onClick={() => {
            setMode("none");
            setError(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="edit-booking-title"
                    className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
                  >
                    {useFullEdit ? "Edit booking" : "Update response"}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {useFullEdit
                      ? "Update patient, schedule, doctor, and acceptance."
                      : "Accept or reject the request, or adjust the booking remark."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => {
                    setMode("none");
                    setError(null);
                  }}
                >
                  ×
                </button>
              </div>
              {useFullEdit ? (
                <BookingForm
                  layout="modal"
                  intent="edit"
                  title="Edit booking"
                  submitLabel="Save changes"
                  patients={patients}
                  doctors={doctors}
                  doctorStatuses={doctorStatuses}
                  initial={{
                    patientId: selected.patientId,
                    scheduledDate: toDateTimeLocalInput(selected.scheduledDate),
                    bookingRemark: selected.bookingRemark ?? "",
                    requestedDoctorId: selected.requestedDoctorId ?? "",
                    doctorStatusId: selected.doctorStatusId ?? "",
                  }}
                  onCancel={() => setMode("none")}
                  onSubmit={async (values) => {
                    setError(null);
                    const res = await fetch(`/api/bookings/${selected.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(values),
                    });
                    if (!res.ok) {
                      const msg = await res.text().catch(() => "");
                      throw new Error(msg || "Update failed");
                    }
                    await refresh();
                    setMode("none");
                    toast.success("Booking updated");
                  }}
                />
              ) : (
                <DoctorScopedEditForm
                  layout="modal"
                  doctorStatuses={doctorStatuses}
                  initial={{
                    bookingRemark: selected.bookingRemark ?? "",
                    doctorStatusId: selected.doctorStatusId ?? "",
                  }}
                  onCancel={() => setMode("none")}
                  onSubmit={async (values) => {
                    setError(null);
                    const res = await fetch(`/api/bookings/${selected.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(values),
                    });
                    if (!res.ok) {
                      const msg = await res.text().catch(() => "");
                      throw new Error(msg || "Update failed");
                    }
                    await refresh();
                    setMode("none");
                    toast.success("Booking updated");
                  }}
                />
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {mode === "preview" && selected ? (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-booking-title"
          onClick={() => {
            setMode("none");
            setError(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="preview-booking-title"
                    className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
                  >
                    Preview booking
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">Read-only details.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => {
                    setMode("none");
                    setError(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="preview-shell sm:grid-cols-2">
                <section className="preview-section">
                  <h3 className="preview-section-title">References</h3>
                  <dl className="preview-list">
                    <div className="preview-row">
                      <dt className="preview-label">Patient</dt>
                      <dd className="preview-value">{selected.patient?.fullName ?? "—"}</dd>
                    </div>
                    <div className="preview-row">
                      <dt className="preview-label">Requested doctor</dt>
                      <dd className="preview-value">{selected.requestedDoctor?.fullName ?? "—"}</dd>
                    </div>
                    <div className="preview-row">
                      <dt className="preview-label">Doctor status</dt>
                      <dd className="preview-value">
                        {selected.doctorStatusLookup?.lookupValue ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </section>
                <section className="preview-section">
                  <h3 className="preview-section-title">Schedule & Remark</h3>
                  <dl className="preview-list">
                    <div className="preview-row">
                      <dt className="preview-label">Date & Time</dt>
                      <dd className="preview-value">{formatDateTime(selected.scheduledDate)}</dd>
                    </div>
                    <div className="preview-row">
                      <dt className="preview-label">Booking remark</dt>
                      <dd className="preview-value">{selected.bookingRemark ?? "—"}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="tbl-shell overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Dr. status</th>
              <th className="px-4 py-3">Booking remark</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const isBusy = busyId === booking.id;
              const showPendingActions =
                canEdit &&
                booking.requestedDoctorId === currentUserId &&
                booking.doctorStatusLookup?.lookupKey === "PENDING";
              return (
                <tr key={booking.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{booking.patient?.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(booking.scheduledDate)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {booking.requestedDoctor?.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {booking.doctorStatusLookup?.lookupValue ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{booking.bookingRemark ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {showPendingActions ? (
                        <>
                          <Button
                            type="button"
                            variant="create"
                            className="h-9 px-3"
                            disabled={isBusy}
                            onClick={() => void setDoctorDecision(booking.id, "ACCEPTED")}
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 px-3"
                            disabled={isBusy}
                            onClick={() => void setDoctorDecision(booking.id, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {canPreview ? (
                        <Button
                          type="button"
                          variant="preview"
                          className="h-9 px-3"
                          disabled={isBusy}
                          onClick={() => {
                            setSelectedId(booking.id);
                            setMode("preview");
                            setError(null);
                          }}
                        >
                          Preview
                        </Button>
                      ) : null}
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="edit"
                          className="h-9 px-3"
                          disabled={isBusy}
                          onClick={() =>
                            setActionConfirm({ type: "edit", id: booking.id })
                          }
                        >
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="delete"
                          className="h-9 px-3"
                          disabled={isBusy}
                          onClick={() =>
                            setActionConfirm({ type: "delete", id: booking.id })
                          }
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type BookingFormValues = {
  patientId: string;
  scheduledDate: string;
  bookingRemark?: string;
  requestedDoctorId?: string;
  doctorStatusId?: string;
};

function BookingForm({
  title,
  submitLabel,
  intent,
  patients,
  doctors,
  doctorStatuses,
  onCancel,
  onSubmit,
  initial,
  layout = "card",
}: {
  title: string;
  submitLabel: string;
  intent: "create" | "edit";
  patients: PatientOption[];
  doctors: DoctorProfileOption[];
  doctorStatuses?: DoctorStatusOption[];
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  initial?: Partial<BookingFormValues>;
  layout?: "card" | "modal";
}) {
  const [values, setValues] = useState<BookingFormValues>({
    patientId: initial?.patientId ?? patients[0]?.id ?? "",
    scheduledDate: initial?.scheduledDate ?? "",
    bookingRemark: initial?.bookingRemark ?? "",
    requestedDoctorId: initial?.requestedDoctorId ?? "",
    doctorStatusId: initial?.doctorStatusId ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectClass =
    "h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/25";

  function buildPayload(): Record<string, unknown> {
    const base = {
      patientId: values.patientId,
      scheduledDate: values.scheduledDate.trim() ? values.scheduledDate : null,
      bookingRemark: values.bookingRemark?.trim() ? values.bookingRemark.trim() : null,
      requestedDoctorId: (values.requestedDoctorId ?? "").trim()
        ? (values.requestedDoctorId ?? "").trim()
        : null,
    };
    if (intent === "edit" && doctorStatuses?.length) {
      const ds = (values.doctorStatusId ?? "").trim();
      return {
        ...base,
        doctorStatusId: ds ? ds : null,
      };
    }
    return base;
  }

  const formBody = (
    <>
      {layout === "card" ? (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="text-lg font-semibold text-[var(--text-primary)]">{title}</div>
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsSubmitting(true);
          try {
            await onSubmit(buildPayload());
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Something went wrong";
            setError(msg);
            toast.error(msg);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Patient</span>
          <select
            className={selectClass}
            value={values.patientId}
            onChange={(e) => setValues((v) => ({ ...v, patientId: e.target.value }))}
            required
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Requested doctor (optional)</span>
          <select
            className={selectClass}
            value={values.requestedDoctorId}
            onChange={(e) => setValues((v) => ({ ...v, requestedDoctorId: e.target.value }))}
          >
            <option value="">None</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.email})
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Scheduled date & time (optional)"
          name="scheduledDate"
          type="datetime-local"
          value={values.scheduledDate}
          onChange={(e) => setValues((v) => ({ ...v, scheduledDate: e.target.value }))}
        />

        {intent === "edit" && doctorStatuses?.length ? (
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="font-medium text-[var(--text-primary)]">Doctor acceptance</span>
            <select
              className={selectClass}
              value={values.doctorStatusId}
              onChange={(e) => setValues((v) => ({ ...v, doctorStatusId: e.target.value }))}
            >
              <option value="">—</option>
              {doctorStatuses.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.lookupValue}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-[var(--text-primary)]">Booking remark</span>
          <textarea
            className={`${selectClass} min-h-[88px] py-2`}
            value={values.bookingRemark}
            onChange={(e) => setValues((v) => ({ ...v, bookingRemark: e.target.value }))}
            rows={3}
          />
        </label>

        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={intent === "create" ? "create" : "edit"}
            isLoading={isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </>
  );

  if (layout === "modal") {
    return formBody;
  }

  return <div className="surface-card p-6">{formBody}</div>;
}

function DoctorScopedEditForm({
  initial,
  doctorStatuses,
  onCancel,
  onSubmit,
  layout = "card",
}: {
  initial: { bookingRemark: string; doctorStatusId: string };
  doctorStatuses: DoctorStatusOption[];
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  layout?: "card" | "modal";
}) {
  const [values, setValues] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectClass =
    "h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/25";

  const formBody = (
    <>
      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsSubmitting(true);
          try {
            await onSubmit({
              doctorStatusId: (values.doctorStatusId ?? "").trim()
                ? (values.doctorStatusId ?? "").trim()
                : null,
              bookingRemark: values.bookingRemark?.trim() ? values.bookingRemark.trim() : null,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Something went wrong";
            setError(msg);
            toast.error(msg);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-[var(--text-primary)]">Doctor acceptance</span>
          <select
            className={selectClass}
            value={values.doctorStatusId}
            onChange={(e) => setValues((v) => ({ ...v, doctorStatusId: e.target.value }))}
          >
            <option value="">—</option>
            {doctorStatuses.map((d) => (
              <option key={d.id} value={d.id}>
                {d.lookupValue}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-[var(--text-primary)]">Booking remark</span>
          <textarea
            className={`${selectClass} min-h-[88px] py-2`}
            value={values.bookingRemark}
            onChange={(e) => setValues((v) => ({ ...v, bookingRemark: e.target.value }))}
            rows={3}
          />
        </label>

        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="edit" isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </>
  );

  if (layout === "modal") {
    return formBody;
  }
  return <div className="surface-card p-6">{formBody}</div>;
}

function formatDateTime(value: string | null) {
  if (value === null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function toDateTimeLocalInput(value: string | null) {
  if (value === null || value === "") return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}
