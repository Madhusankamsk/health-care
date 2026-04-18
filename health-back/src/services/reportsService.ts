import prisma from "../prisma/client";

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function startOfMonthLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    const fn = (value as { toNumber?: () => number }).toNumber;
    if (typeof fn === "function") return fn.call(value);
  }
  return Number(value ?? 0);
}

export async function getReportsOverview() {
  const today = startOfTodayLocal();

  const [
    totalPatients,
    totalBookings,
    totalInvoices,
    todayDispatches,
    todayOpdWaiting,
    todayDiagnosticUploads,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.booking.count(),
    prisma.invoice.count(),
    prisma.dispatchRecord.count({ where: { dispatchedAt: { gte: today } } }),
    prisma.opdQueue.count({ where: { visitDate: { gte: today }, status: { equals: "Waiting", mode: "insensitive" } } }),
    prisma.diagnosticReport.count({ where: { uploadedAt: { gte: today } } }),
  ]);

  return {
    kpis: {
      totalPatients,
      totalBookings,
      totalInvoices,
      todayDispatches,
      todayOpdWaiting,
      todayDiagnosticUploads,
    },
  };
}

export async function getReportsFinancial() {
  const monthStart = startOfMonthLocal();

  const [allInvoices, monthPayments, paymentMethodRows] = await Promise.all([
    prisma.invoice.findMany({ select: { totalAmount: true, paidAmount: true, balanceDue: true } }),
    prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: { paidAt: { gte: monthStart } },
    }),
    prisma.payment.groupBy({
      by: ["paymentMethodId"],
      _sum: { amountPaid: true },
      _count: { _all: true },
      orderBy: { _count: { paymentMethodId: "desc" } },
    }),
  ]);

  const totals = allInvoices.reduce(
    (acc, item) => {
      acc.invoiced += toNumber(item.totalAmount);
      acc.paid += toNumber(item.paidAmount);
      acc.outstanding += toNumber(item.balanceDue);
      return acc;
    },
    { invoiced: 0, paid: 0, outstanding: 0 },
  );

  const methodLookups = await prisma.lookup.findMany({
    where: { id: { in: paymentMethodRows.map((r) => r.paymentMethodId) } },
    select: { id: true, lookupValue: true },
  });
  const lookupById = new Map(methodLookups.map((l) => [l.id, l.lookupValue]));

  return {
    summary: {
      invoiced: totals.invoiced,
      paid: totals.paid,
      outstanding: totals.outstanding,
      monthCollections: toNumber(monthPayments._sum.amountPaid),
    },
    byMethod: paymentMethodRows.map((row) => ({
      methodId: row.paymentMethodId,
      methodName: lookupById.get(row.paymentMethodId) ?? "Unknown",
      total: toNumber(row._sum.amountPaid),
      count: row._count._all,
    })),
  };
}

export async function getReportsOperations() {
  const [bookingsPending, bookingsAccepted, dispatchUpcoming, dispatchOngoing, opdWaiting, labPending] =
    await Promise.all([
      prisma.booking.count({
        where: { isOpd: false, doctorStatusLookup: { lookupKey: "PENDING" } },
      }),
      prisma.booking.count({
        where: { isOpd: false, doctorStatusLookup: { lookupKey: "ACCEPTED" } },
      }),
      prisma.dispatchRecord.count({
        where: { statusLookup: { lookupKey: { in: ["PENDING", "ASSIGNED", "UPCOMING"] } } },
      }),
      prisma.dispatchRecord.count({
        where: { statusLookup: { lookupKey: { in: ["STARTED", "ENROUTE", "IN_PROGRESS"] } } },
      }),
      prisma.opdQueue.count({ where: { status: { equals: "Waiting", mode: "insensitive" } } }),
      prisma.labSample.count({
        where: { OR: [{ resultReportUrl: null }, { resultReceivedAt: null }] },
      }),
    ]);

  return {
    workload: {
      bookingsPending,
      bookingsAccepted,
      dispatchUpcoming,
      dispatchOngoing,
      opdWaiting,
      labPending,
    },
  };
}

export async function getReportsClinical() {
  const [visitsTotal, visitsCompleted, reportsTotal, reportsLast7Days, labSamplesTotal, labResultsReceived] =
    await Promise.all([
      prisma.visitRecord.count(),
      prisma.visitRecord.count({ where: { completedAt: { not: null } } }),
      prisma.diagnosticReport.count(),
      prisma.diagnosticReport.count({
        where: { uploadedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.labSample.count(),
      prisma.labSample.count({ where: { resultReceivedAt: { not: null } } }),
    ]);

  return {
    clinical: {
      visitsTotal,
      visitsCompleted,
      reportsTotal,
      reportsLast7Days,
      labSamplesTotal,
      labResultsReceived,
    },
  };
}

export async function getReportsActivity() {
  const [latestBookings, latestReports, latestPayments] = await Promise.all([
    prisma.booking.findMany({
      take: 8,
      orderBy: { scheduledDate: "desc" },
      include: { patient: { select: { fullName: true } } },
    }),
    prisma.diagnosticReport.findMany({
      take: 8,
      orderBy: { uploadedAt: "desc" },
      include: { patient: { select: { fullName: true } }, uploadedBy: { select: { fullName: true } } },
    }),
    prisma.payment.findMany({
      take: 8,
      orderBy: { paidAt: "desc" },
      include: {
        collectedBy: { select: { fullName: true } },
        invoice: { select: { patient: { select: { fullName: true } } } },
      },
    }),
  ]);

  const events = [
    ...latestBookings.map((row) => ({
      id: `booking-${row.id}`,
      type: "booking_created",
      at: (row.scheduledDate ?? new Date()).toISOString(),
      title: `Booking created for ${row.patient?.fullName ?? "Patient"}`,
      detail: row.bookingRemark?.trim() || null,
    })),
    ...latestReports.map((row) => ({
      id: `diagnostic-${row.id}`,
      type: "diagnostic_uploaded",
      at: row.uploadedAt.toISOString(),
      title: `${row.reportName} uploaded`,
      detail: `${row.patient?.fullName ?? "Patient"} by ${row.uploadedBy.fullName}`,
    })),
    ...latestPayments.map((row) => ({
      id: `payment-${row.id}`,
      type: "payment_recorded",
      at: row.paidAt.toISOString(),
      title: `Payment recorded (${toNumber(row.amountPaid).toFixed(2)})`,
      detail: `${row.invoice?.patient?.fullName ?? "Patient"} by ${row.collectedBy.fullName}`,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20);

  return { events };
}
