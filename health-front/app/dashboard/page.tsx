import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { getIsAuthenticated } from "@/lib/auth";
import { type BackendMeResponse, backendJson } from "@/lib/backend";

type DashboardSummaryTileItem = {
  id: string;
  title: string;
  subtitle: string;
  detail?: string | null;
};

type DashboardSummaryTile = {
  mode: "list" | "kpi";
  count: number;
  summaryPill: string;
  href: string;
  items: DashboardSummaryTileItem[];
  kpiHint?: string | null;
};

type DashboardSummaryResponse = {
  currencyCode: string;
  tiles: {
    bookingsPending?: DashboardSummaryTile;
    bookingsAccepted?: DashboardSummaryTile;
    dispatchUpcoming?: DashboardSummaryTile;
    dispatchOngoing?: DashboardSummaryTile;
    opdWaiting?: DashboardSummaryTile;
    labPending?: DashboardSummaryTile;
    countPatients?: DashboardSummaryTile;
    countBookings?: DashboardSummaryTile;
    countVehicles?: DashboardSummaryTile;
    statRevenue?: DashboardSummaryTile;
    statOutstanding?: DashboardSummaryTile;
  };
};

type TileSection = "kpi" | "list";

const TILE_LABELS: {
  key: keyof NonNullable<DashboardSummaryResponse["tiles"]>;
  title: string;
  section: TileSection;
}[] = [
  { key: "countPatients", title: "Patients", section: "kpi" },
  { key: "countBookings", title: "Total bookings", section: "kpi" },
  { key: "countVehicles", title: "Vehicles", section: "kpi" },
  { key: "statRevenue", title: "Revenue collected", section: "kpi" },
  { key: "statOutstanding", title: "Outstanding", section: "kpi" },
  { key: "bookingsPending", title: "Pending doctor acceptance", section: "list" },
  { key: "bookingsAccepted", title: "Accepted by doctor", section: "list" },
  { key: "dispatchUpcoming", title: "Dispatch — upcoming jobs", section: "list" },
  { key: "dispatchOngoing", title: "Dispatch — ongoing jobs", section: "list" },
  { key: "opdWaiting", title: "OPD — waiting today", section: "list" },
  { key: "labPending", title: "Lab — pending samples", section: "list" },
];

function DashboardKpiTile({
  label,
  tile,
}: {
  label: string;
  tile: DashboardSummaryTile;
}) {
  return (
    <Card title={label}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="pill pill-info text-xs font-medium">{tile.summaryPill}</span>
          <Link
            href={tile.href}
            className="text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Open
          </Link>
        </div>
        {tile.kpiHint ? (
          <p className="text-xs text-[var(--text-secondary)]">{tile.kpiHint}</p>
        ) : null}
      </div>
    </Card>
  );
}

function DashboardListTile({
  label,
  tile,
}: {
  label: string;
  tile: DashboardSummaryTile;
}) {
  return (
    <Card title={label}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="pill pill-info text-xs font-medium">{tile.summaryPill}</span>
        <Link
          href={tile.href}
          className="text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Go to screen
        </Link>
      </div>
      {tile.items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">None right now.</p>
      ) : (
        <ul className="flex flex-col gap-3 text-sm">
          {tile.items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="font-medium text-[var(--text-primary)]">{item.title}</div>
              <div className="mt-1 text-[var(--text-secondary)]">{item.subtitle}</div>
              {item.detail ? (
                <div className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{item.detail}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const isAuthenticated = await getIsAuthenticated();
  if (!isAuthenticated) {
    redirect("/");
  }

  const me = await backendJson<BackendMeResponse>("/api/me");
  if (!me) redirect("/");

  const summary = await backendJson<DashboardSummaryResponse>("/api/dashboard/summary");
  const tiles = summary?.tiles ?? {};
  const currencyNote = summary?.currencyCode?.trim()
    ? ` Amounts use ${summary.currencyCode}.`
    : "";

  const kpiKeys = TILE_LABELS.filter((t) => t.section === "kpi")
    .map((t) => t.key)
    .filter((k) => tiles[k] != null);
  const listKeys = TILE_LABELS.filter((t) => t.section === "list")
    .map((t) => t.key)
    .filter((k) => tiles[k] != null);
  const hasAnyTile = kpiKeys.length > 0 || listKeys.length > 0;

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            KPI counts and urgent queues from modules your role can access.{currencyNote}
          </p>
        </div>
        <span className="pill pill-info w-fit">Live overview</span>
      </header>

      {!hasAnyTile ? (
        <Card title="Overview" description="No dashboard tiles are enabled for your role yet.">
          <p className="text-sm text-[var(--text-secondary)]">
            Ask an administrator to grant the relevant{" "}
            <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs">dashboard:tile_*</code>{" "}
            permissions together with matching module access (patients, bookings, vehicles, invoices,
            dispatch, OPD, lab).
          </p>
        </Card>
      ) : (
        <>
          {kpiKeys.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Counts and totals
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {TILE_LABELS.filter((t) => t.section === "kpi").map(({ key, title }) => {
                  const tile = tiles[key];
                  if (!tile) return null;
                  return <DashboardKpiTile key={key} label={title} tile={tile} />;
                })}
              </div>
            </section>
          ) : null}

          {listKeys.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Urgent and queues
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {TILE_LABELS.filter((t) => t.section === "list").map(({ key, title }) => {
                  const tile = tiles[key];
                  if (!tile) return null;
                  return <DashboardListTile key={key} label={title} tile={tile} />;
                })}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
