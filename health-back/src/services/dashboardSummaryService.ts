import prisma from "../prisma/client";
import {
  countOngoingForDispatch,
  countUpcomingAcceptedForDispatch,
  listOngoingForDispatch,
  listUpcomingAcceptedForDispatch,
} from "./dispatchService";
import type { BookingListScope } from "./bookingService";
import { resolveBookingListScope } from "./bookingService";

const PREVIEW_LIMIT = 8;

const HREF = {
  bookings: "/dashboard/bookings/manage-bookings",
  dispatchUpcoming: "/dashboard/dispatching/upcoming-jobs",
  dispatchOngoing: "/dashboard/dispatching/ongoing-jobs",
  opd: "/dashboard/opd/queue",
  /** Lab samples are managed from patient booking workflow. */
  lab: "/dashboard/bookings/manage-bookings",
  patients: "/dashboard/clients/patient",
  vehicles: "/dashboard/admin/vehicles",
  paymentsVisit: "/dashboard/payments/visit",
  paymentsAccounts: "/dashboard/payments/accounts",
} as const;

async function getCompanyCurrencyCode(): Promise<string> {
  const row = await prisma.companySettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { currencyCode: true },
  });
  const c = row?.currencyCode?.trim();
  return c && c.length > 0 ? c : "LKR";
}

function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return `${currency} 0.00`;
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function hasAny(permissions: string[], keys: string[]): boolean {
  const set = new Set(permissions);
  return keys.some((k) => set.has(k));
}

function hasAll(permissions: string[], keys: string[]): boolean {
  const set = new Set(permissions);
  return keys.every((k) => set.has(k));
}

function bookingModuleOk(permissions: string[]): boolean {
  return hasAny(permissions, ["bookings:list", "bookings:read"]);
}

function dispatchModuleOk(permissions: string[]): boolean {
  return hasAny(permissions, ["dispatch:list", "dispatch:read", "dispatch:update"]);
}

function opdModuleOk(permissions: string[]): boolean {
  return hasAny(permissions, ["opd:list", "opd:read"]);
}

function labModuleOk(permissions: string[]): boolean {
  return hasAny(permissions, ["lab:list", "lab:read"]);
}

function patientsModuleOk(permissions: string[]): boolean {
  return hasAny(permissions, ["patients:list", "patients:read"]);
}

function vehiclesModuleOk(permissions: string[]): boolean {
  return hasAny(permissions, ["vehicles:list", "vehicles:read"]);
}

function invoicesModuleOk(permissions: string[]): boolean {
  return permissions.includes("invoices:read");
}

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function startOfTomorrowLocal() {
  const d = startOfTodayLocal();
  d.setDate(d.getDate() + 1);
  return d;
}

export type DashboardSummaryTileItem = {
  id: string;
  title: string;
  subtitle: string;
  detail?: string | null;
};

export type DashboardSummaryTile = {
  /** `list` = urgent queue with previews; `kpi` = count or monetary snapshot only. */
  mode: "list" | "kpi";
  count: number;
  /** Primary metric label for the pill (e.g. "3 open", "120 patients", "LKR 1,234.00 collected"). */
  summaryPill: string;
  href: string;
  items: DashboardSummaryTileItem[];
  /** Short line under the pill for KPI tiles. */
  kpiHint?: string | null;
};

export type DashboardSummaryResponse = {
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

function formatWhen(value: Date | null): string {
  if (value === null) return "—";
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleString();
}

export async function buildDashboardSummary(params: {
  userId: string;
  permissionKeys: string[];
}): Promise<DashboardSummaryResponse> {
  const { userId, permissionKeys: keys } = params;
  const scope = resolveBookingListScope(keys);
  const tiles: DashboardSummaryResponse["tiles"] = {};
  const currencyCode = await getCompanyCurrencyCode();

  const scopeWhere =
    scope === "own" ? { requestedDoctorId: userId } : ({} as Record<string, unknown>);

  // --- Bookings pending ---
  if (
    hasAll(keys, ["dashboard:tile_bookings_pending"]) &&
    bookingModuleOk(keys)
  ) {
    const where = {
      bookingTypeLookup: { lookupKey: "VISIT" },
      doctorStatusLookup: { lookupKey: "PENDING" },
      ...scopeWhere,
    };
    const count = await prisma.booking.count({ where });
    const rows = await prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      take: PREVIEW_LIMIT,
      include: {
        patient: { select: { fullName: true } },
        requestedDoctor: { select: { fullName: true } },
      },
    });
    tiles.bookingsPending = {
      mode: "list",
      summaryPill: `${count} open`,
      count,
      href: HREF.bookings,
      items: rows.map((b) => ({
        id: b.id,
        title: b.patient?.fullName ?? "Patient",
        subtitle: `${formatWhen(b.scheduledDate)} · ${b.requestedDoctor?.fullName ?? "Doctor TBD"}`,
        detail: b.bookingRemark?.trim() || null,
      })),
    };
  }

  // --- Bookings accepted ---
  if (
    hasAll(keys, ["dashboard:tile_bookings_accepted"]) &&
    bookingModuleOk(keys)
  ) {
    const where = {
      bookingTypeLookup: { lookupKey: "VISIT" },
      doctorStatusLookup: { lookupKey: "ACCEPTED" },
      ...scopeWhere,
    };
    const count = await prisma.booking.count({ where });
    const rows = await prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      take: PREVIEW_LIMIT,
      include: {
        patient: { select: { fullName: true } },
        requestedDoctor: { select: { fullName: true } },
      },
    });
    tiles.bookingsAccepted = {
      mode: "list",
      summaryPill: `${count} open`,
      count,
      href: HREF.bookings,
      items: rows.map((b) => ({
        id: b.id,
        title: b.patient?.fullName ?? "Patient",
        subtitle: `${formatWhen(b.scheduledDate)} · ${b.requestedDoctor?.fullName ?? "—"}`,
        detail: b.bookingRemark?.trim() || null,
      })),
    };
  }

  // --- Dispatch upcoming / ongoing (reuse dispatch service + crew-aware ongoing) ---
  if (
    hasAll(keys, ["dashboard:tile_dispatch_upcoming"]) &&
    dispatchModuleOk(keys)
  ) {
    const sc = scope as BookingListScope;
    const [count, rows] = await Promise.all([
      countUpcomingAcceptedForDispatch({ userId, scope: sc }),
      listUpcomingAcceptedForDispatch({ userId, scope: sc, limit: PREVIEW_LIMIT }),
    ]);
    tiles.dispatchUpcoming = {
      mode: "list",
      summaryPill: `${count} open`,
      count,
      href: HREF.dispatchUpcoming,
      items: rows.map((b) => ({
        id: b.id,
        title: b.patient?.fullName ?? "Patient",
        subtitle: `${formatWhen(b.scheduledDate)} · ${b.requestedDoctor?.fullName ?? "—"}`,
        detail: b.bookingRemark?.trim() || null,
      })),
    };
  }

  if (
    hasAll(keys, ["dashboard:tile_dispatch_ongoing"]) &&
    dispatchModuleOk(keys)
  ) {
    const sc = scope as BookingListScope;
    const [count, rows] = await Promise.all([
      countOngoingForDispatch({ userId, scope: sc }),
      listOngoingForDispatch({ userId, scope: sc, limit: PREVIEW_LIMIT }),
    ]);
    const latestDispatch = (b: (typeof rows)[0]) => b.dispatchRecords?.[0];
    tiles.dispatchOngoing = {
      mode: "list",
      summaryPill: `${count} open`,
      count,
      href: HREF.dispatchOngoing,
      items: rows.map((b) => {
        const d = latestDispatch(b);
        const vehicle = d?.vehicle?.vehicleNo ?? "—";
        return {
          id: b.id,
          title: b.patient?.fullName ?? "Patient",
          subtitle: `${formatWhen(b.scheduledDate)} · ${d?.statusLookup?.lookupValue ?? "—"} · ${vehicle}`,
          detail: b.bookingRemark?.trim() || null,
        };
      }),
    };
  }

  // --- OPD waiting today ---
  if (hasAll(keys, ["dashboard:tile_opd_waiting"]) && opdModuleOk(keys)) {
    const dayStart = startOfTodayLocal();
    const dayEnd = startOfTomorrowLocal();
    const where = {
      visitDate: { gte: dayStart, lt: dayEnd },
      statusLookup: { lookupKey: "WAITING" },
    };
    const count = await prisma.opdQueue.count({ where });
    const rows = await prisma.opdQueue.findMany({
      where,
      orderBy: [{ tokenNo: "asc" }, { visitDate: "asc" }],
      take: PREVIEW_LIMIT,
      include: {
        patient: { select: { fullName: true } },
        statusLookup: { select: { lookupValue: true } },
      },
    });
    tiles.opdWaiting = {
      mode: "list",
      summaryPill: `${count} open`,
      count,
      href: HREF.opd,
      items: rows.map((q) => ({
        id: q.id,
        title: q.patient?.fullName ?? "Patient",
        subtitle: `Token ${q.tokenNo} · ${q.statusLookup?.lookupValue ?? "Waiting"}`,
        detail: null,
      })),
    };
  }

  // --- Lab samples not completed ---
  if (hasAll(keys, ["dashboard:tile_lab_pending"]) && labModuleOk(keys)) {
    const where = {
      statusLookup: { isNot: { lookupKey: "COMPLETED" } },
    };
    const count = await prisma.labSample.count({ where });
    const rows = await prisma.labSample.findMany({
      where,
      orderBy: { collectedAt: "desc" },
      take: PREVIEW_LIMIT,
      include: {
        patient: { select: { fullName: true } },
        statusLookup: { select: { lookupKey: true, lookupValue: true } },
      },
    });
    tiles.labPending = {
      mode: "list",
      summaryPill: `${count} open`,
      count,
      href: HREF.lab,
      items: rows.map((s) => ({
        id: s.id,
        title: s.patient?.fullName ?? "Patient",
        subtitle: `${s.sampleType} · ${s.statusLookup?.lookupValue ?? "—"}`,
        detail: s.labName?.trim() || null,
      })),
    };
  }

  // --- KPI: patients (total registered) ---
  if (hasAll(keys, ["dashboard:tile_count_patients"]) && patientsModuleOk(keys)) {
    const count = await prisma.patient.count();
    tiles.countPatients = {
      mode: "kpi",
      count,
      summaryPill: `${count.toLocaleString()} patients`,
      href: HREF.patients,
      items: [],
      kpiHint: "Total patients in the system.",
    };
  }

  // --- KPI: bookings (all bookings; scoped to requested doctor when scope is own) ---
  if (hasAll(keys, ["dashboard:tile_count_bookings"]) && bookingModuleOk(keys)) {
    const count = await prisma.booking.count({
      where: scope === "own" ? { requestedDoctorId: userId } : {},
    });
    tiles.countBookings = {
      mode: "kpi",
      count,
      summaryPill: `${count.toLocaleString()} bookings`,
      href: HREF.bookings,
      items: [],
      kpiHint:
        scope === "own"
          ? "Bookings where you are the requested doctor."
          : "All bookings in the system.",
    };
  }

  // --- KPI: vehicles (fleet) ---
  if (hasAll(keys, ["dashboard:tile_count_vehicles"]) && vehiclesModuleOk(keys)) {
    const count = await prisma.vehicle.count();
    tiles.countVehicles = {
      mode: "kpi",
      count,
      summaryPill: `${count.toLocaleString()} vehicles`,
      href: HREF.vehicles,
      items: [],
      kpiHint: "Registered vehicles.",
    };
  }

  // --- KPI: revenue (sum of all payments recorded) ---
  if (hasAll(keys, ["dashboard:tile_stat_revenue"]) && invoicesModuleOk(keys)) {
    const [agg, paymentCount] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amountPaid: true } }),
      prisma.payment.count(),
    ]);
    const total = Number(agg._sum.amountPaid ?? 0);
    tiles.statRevenue = {
      mode: "kpi",
      count: paymentCount,
      summaryPill: `${formatMoney(total, currencyCode)} collected`,
      href: HREF.paymentsVisit,
      items: [],
      kpiHint: `Across ${paymentCount.toLocaleString()} payment record(s).`,
    };
  }

  // --- KPI: outstanding (unpaid invoice balances) ---
  if (hasAll(keys, ["dashboard:tile_stat_outstanding"]) && invoicesModuleOk(keys)) {
    const [agg, invCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { balanceDue: { gt: 0 } },
        _sum: { balanceDue: true },
      }),
      prisma.invoice.count({ where: { balanceDue: { gt: 0 } } }),
    ]);
    const total = Number(agg._sum.balanceDue ?? 0);
    tiles.statOutstanding = {
      mode: "kpi",
      count: invCount,
      summaryPill: `${formatMoney(total, currencyCode)} outstanding`,
      href: HREF.paymentsAccounts,
      items: [],
      kpiHint: `Open balance on ${invCount.toLocaleString()} invoice(s).`,
    };
  }

  return { currencyCode, tiles };
}
