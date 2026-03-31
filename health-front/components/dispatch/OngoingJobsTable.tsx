"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { MedicalTeam } from "@/components/admin/MedicalTeamManager";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

import { DispatchPreviewPanel } from "./DispatchPreviewPanel";
import {
  formatCrewMemberName,
  formatScheduled,
  teamNameForVehicle,
} from "./dispatchDisplay";
import type { UpcomingBookingRow } from "./types";

export type { UpcomingBookingRow };

type OngoingJobsTableProps = {
  initialRows: UpcomingBookingRow[];
  teams: MedicalTeam[] | null;
  canPreview: boolean;
  canFullView: boolean;
};

export function OngoingJobsTable({
  initialRows,
  teams,
  canPreview,
  canFullView,
}: OngoingJobsTableProps) {
  const [previewBookingId, setPreviewBookingId] = useState<string | null>(null);

  const previewTarget = useMemo(() => {
    if (!previewBookingId) return null;
    return initialRows.find((r) => r.id === previewBookingId) ?? null;
  }, [previewBookingId, initialRows]);

  const previewFullViewHref =
    previewTarget?.patient?.id != null
      ? `/dashboard/clients/patient/${previewTarget.patient.id}`
      : "/dashboard/bookings/manage-bookings";

  function closePreview() {
    setPreviewBookingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="tbl-shell overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Remark</th>
              <th className="px-4 py-3">Dispatch</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No ongoing jobs. Dispatched bookings appear here while in transit or arrived on site
                  before the visit is started.
                </td>
              </tr>
            ) : (
              initialRows.map((row) => {
                const latest = row.dispatchRecords[0];
                const statusKey = latest?.statusLookup?.lookupKey;
                const assignedTeamName =
                  latest && teams?.length
                    ? teamNameForVehicle(teams, latest.vehicle.id)
                    : null;

                return (
                  <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {row.patient?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {formatScheduled(row.scheduledDate)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {row.requestedDoctor?.fullName ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[var(--text-secondary)]">
                      {row.bookingRemark?.trim() ? row.bookingRemark : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {latest ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-[var(--text-primary)]">
                            {latest.statusLookup?.lookupValue ?? statusKey ?? "—"}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {assignedTeamName ?? latest.vehicle.vehicleNo}
                            {" · "}
                            {latest.vehicle.vehicleNo}
                            {latest.assignments.length
                              ? ` · ${latest.assignments.map((a) => formatCrewMemberName(a.user)).join(", ")}`
                              : null}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canPreview ? (
                          <Button
                            type="button"
                            variant="preview"
                            className="h-9 px-3"
                            onClick={() => setPreviewBookingId(row.id)}
                          >
                            Preview
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ModalShell
        open={previewBookingId !== null}
        onClose={closePreview}
        titleId="ongoing-dispatch-preview"
        title="Preview booking"
        subtitle="Read-only details."
        maxWidthClass="max-w-4xl"
        headerTrailing={
          canFullView && previewTarget ? (
            <Link
              href={previewFullViewHref}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition-all duration-150 hover:bg-[var(--surface-2)] focus-visible:outline-none active:translate-y-px"
            >
              Full View
            </Link>
          ) : null
        }
      >
        {!previewTarget ? (
          <p className="text-sm text-[var(--text-secondary)]">Booking not found.</p>
        ) : (
          <DispatchPreviewPanel dispatchTarget={previewTarget} teams={teams} />
        )}
      </ModalShell>
    </div>
  );
}
