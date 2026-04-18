import prisma from "../prisma/client";

import { invoiceOutstandingTextSearchWhere } from "../lib/searchWhere";

export type OutstandingInvoiceRow = {
  id: string;
  invoiceType: "MEMBERSHIP" | "VISIT" | "OPD";
  createdAt: string;
  balanceDue: string;
  totalAmount: string;
  paidAmount: string;
  patientId: string | null;
  patientName: string | null;
  subscriptionAccountId: string | null;
  accountName: string | null;
  planName: string | null;
  bookingId: string | null;
  bookingScheduledDate: string | null;
};

function mapOutstandingInvoiceRow(
  row: {
    id: string;
    invoiceTypeLookup: { lookupKey: string };
    createdAt: Date;
    balanceDue: unknown;
    totalAmount: unknown;
    paidAmount: unknown;
    membershipInvoice: {
      patientId: string | null;
      patient: { fullName: string } | null;
      subscriptionAccountId: string | null;
      subscriptionAccount: {
        accountName: string | null;
        plan: { planName: string | null } | null;
      } | null;
    } | null;
    visitInvoice: {
      patientId: string | null;
      patient: { fullName: string } | null;
      bookingId: string | null;
      booking: { scheduledDate: Date | null } | null;
    } | null;
    opdInvoice: {
      patientId: string | null;
      patient: { fullName: string } | null;
      bookingId: string | null;
      booking: { scheduledDate: Date | null } | null;
    } | null;
  },
): OutstandingInvoiceRow {
  const member = row.membershipInvoice;
  const visit = row.visitInvoice;
  const opd = row.opdInvoice;
  const patient = member?.patient ?? visit?.patient ?? opd?.patient ?? null;
  const key = row.invoiceTypeLookup.lookupKey;
  const invoiceType: OutstandingInvoiceRow["invoiceType"] =
    key === "MEMBERSHIP" ? "MEMBERSHIP" : key === "OPD" ? "OPD" : "VISIT";
  const bookingId = visit?.bookingId ?? opd?.bookingId ?? null;
  const bookingScheduledDate =
    visit?.booking?.scheduledDate?.toISOString() ?? opd?.booking?.scheduledDate?.toISOString() ?? null;
  return {
    id: row.id,
    invoiceType,
    createdAt: row.createdAt.toISOString(),
    balanceDue: String(row.balanceDue),
    totalAmount: String(row.totalAmount),
    paidAmount: String(row.paidAmount),
    patientId: member?.patientId ?? visit?.patientId ?? opd?.patientId ?? null,
    patientName: patient?.fullName ?? null,
    subscriptionAccountId: member?.subscriptionAccountId ?? null,
    accountName: member?.subscriptionAccount?.accountName ?? null,
    planName: member?.subscriptionAccount?.plan?.planName ?? null,
    bookingId,
    bookingScheduledDate,
  };
}

export async function listOutstandingInvoices(params: {
  skip: number;
  take: number;
  q?: string;
}): Promise<{
  items: OutstandingInvoiceRow[];
  total: number;
}> {
  const base = { balanceDue: { gt: 0 } };
  const where = params.q?.trim()
    ? { AND: [base, invoiceOutstandingTextSearchWhere(params.q)] }
    : base;

  const [total, rows] = await prisma.$transaction([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      select: {
      id: true,
      invoiceTypeLookup: { select: { lookupKey: true } },
      createdAt: true,
      balanceDue: true,
      totalAmount: true,
      paidAmount: true,
      membershipInvoice: {
        select: {
          patientId: true,
          patient: { select: { fullName: true } },
          subscriptionAccountId: true,
          subscriptionAccount: {
            select: { accountName: true, plan: { select: { planName: true } } },
          },
        },
      },
      visitInvoice: {
        select: {
          patientId: true,
          patient: { select: { fullName: true } },
          bookingId: true,
          booking: { select: { scheduledDate: true } },
        },
      },
      opdInvoice: {
        select: {
          patientId: true,
          patient: { select: { fullName: true } },
          bookingId: true,
          booking: { select: { scheduledDate: true } },
        },
      },
    },
  }),
  ]);

  const items = rows.map((row) => mapOutstandingInvoiceRow(row as Parameters<typeof mapOutstandingInvoiceRow>[0]));
  return { items, total };
}
