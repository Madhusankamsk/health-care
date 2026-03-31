import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import type { Booking } from "@/components/admin/BookingManager";
import { getIsAuthenticated } from "@/lib/auth";
import { type BackendMeResponse, backendJson } from "@/lib/backend";
import { hasAnyPermission } from "@/lib/rbac";

function formatWhen(value: string | null) {
  if (value === null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default async function DashboardPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) {
    redirect("/");
  }

  const me = await backendJson<BackendMeResponse>("/api/me");
  const canShowBookings =
    me && hasAnyPermission(me.permissions, ["bookings:list"]);

  const bookings =
    canShowBookings && me
      ? await backendJson<Booking[]>("/api/bookings")
      : null;

  const pendingDoctor =
    bookings?.filter((b) => b.doctorStatusLookup?.lookupKey === "PENDING") ?? [];
  const acceptedDoctor =
    bookings?.filter((b) => b.doctorStatusLookup?.lookupKey === "ACCEPTED") ?? [];

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            You are signed in.
          </p>
        </div>
        <span className="pill pill-info w-fit">Live Overview</span>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {canShowBookings && bookings ? (
          <>
            <Card title="Pending doctor acceptance">
              {pendingDoctor.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">None right now.</p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {pendingDoctor.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    >
                      <div className="font-medium text-[var(--text-primary)]">
                        {b.patient?.fullName ?? "Patient"}
                      </div>
                      <div className="mt-1 text-[var(--text-secondary)]">
                        {formatWhen(b.scheduledDate)} ·{" "}
                        {b.requestedDoctor?.fullName ?? "Doctor TBD"}
                      </div>
                      {b.bookingRemark ? (
                        <div className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                          {b.bookingRemark}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Accepted by doctor">
              {acceptedDoctor.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">None right now.</p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {acceptedDoctor.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    >
                      <div className="font-medium text-[var(--text-primary)]">
                        {b.patient?.fullName ?? "Patient"}
                      </div>
                      <div className="mt-1 text-[var(--text-secondary)]">
                        {formatWhen(b.scheduledDate)} ·{" "}
                        {b.requestedDoctor?.fullName ?? "—"}
                      </div>
                      {b.bookingRemark ? (
                        <div className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                          {b.bookingRemark}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : (
          <Card title="Status" description="A placeholder for KPIs / charts.">
            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center justify-between">
                <span>Today&apos;s appointments</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  —
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending messages</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  —
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Open tasks</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  —
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
