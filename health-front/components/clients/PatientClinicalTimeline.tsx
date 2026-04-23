import { formatScheduled } from "@/components/dispatch/dispatchDisplay";

import { Card } from "@/components/ui/Card";

export type PatientNursingAdmissionTimeline = {
  id: string;
  admittedAt: string;
  dischargedAt: string | null;
  siteLabel: string | null;
  statusLookup: { lookupKey: string; lookupValue: string };
  carePathwayLookup: { lookupKey: string; lookupValue: string };
  dailyNotes: Array<{
    id: string;
    recordedAt: string;
    note: string;
    recordedBy: { fullName: string };
  }>;
  encounterBookings: Array<{
    id: string;
    scheduledDate: string | null;
    bookingTypeLookup?: { lookupKey: string; lookupValue: string } | null;
    visitRecord?: { completedAt: string | null } | null;
  }>;
};

export function PatientClinicalTimeline({
  admissions,
}: {
  admissions: PatientNursingAdmissionTimeline[];
}) {
  if (!admissions.length) {
    return (
      <Card
        title="In-house nursing history"
        description="Admissions, daily notes, and diagnostic encounters on company premises."
      >
        <p className="text-sm text-[var(--text-secondary)]">No in-house nursing admissions recorded.</p>
      </Card>
    );
  }

  return (
    <Card
      title="In-house nursing history"
      description="Admissions, daily notes, and diagnostic encounters on company premises. Full visit workflows for encounters appear under Bookings and Dispatch below."
    >
      <div className="space-y-6">
        {admissions.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Admission</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatScheduled(a.admittedAt)}
                  {a.dischargedAt ? ` → ${formatScheduled(a.dischargedAt)}` : " → Active"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="pill pill-info">{a.carePathwayLookup.lookupValue}</span>
                <span className="pill pill-warning">{a.statusLookup.lookupValue}</span>
              </div>
            </div>
            {a.siteLabel?.trim() ? (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-muted)]">Site / room: </span>
                {a.siteLabel.trim()}
              </p>
            ) : null}

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Daily notes
              </p>
              {a.dailyNotes.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">No notes yet.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {a.dailyNotes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    >
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatScheduled(n.recordedAt)} · {n.recordedBy.fullName}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">{n.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Treatment encounters
              </p>
              {a.encounterBookings.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  No diagnostic encounters linked yet. Start one from the nursing board.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {a.encounterBookings.map((eb) => (
                    <li
                      key={eb.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-[var(--text-primary)]">
                        {eb.bookingTypeLookup?.lookupValue ?? "Encounter"}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {eb.scheduledDate ? formatScheduled(eb.scheduledDate) : "—"}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {eb.visitRecord?.completedAt
                          ? `Completed ${formatScheduled(eb.visitRecord.completedAt)}`
                          : "In progress"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
