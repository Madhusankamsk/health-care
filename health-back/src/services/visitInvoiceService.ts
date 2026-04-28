import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

type VisitInvoiceMedicineInput = {
  batchId: string;
  quantity: number;
};

async function computeMedicineSubtotal(tx: Tx, medicines: VisitInvoiceMedicineInput[]): Promise<Prisma.Decimal> {
  if (medicines.length === 0) {
    return new Prisma.Decimal(0);
  }
  const uniqueBatchIds = [...new Set(medicines.map((m) => m.batchId.trim()).filter(Boolean))];
  const batches = await tx.inventoryBatch.findMany({
    where: { id: { in: uniqueBatchIds } },
    select: { id: true, buyingPrice: true },
  });
  const priceByBatchId = new Map<string, Prisma.Decimal>(batches.map((row) => [row.id, row.buyingPrice]));
  return medicines.reduce((sum, medicine) => {
    const batchId = medicine.batchId.trim();
    const batchPrice = priceByBatchId.get(batchId);
    if (!batchPrice) {
      throw new Error("MEDICINE_BATCH_NOT_FOUND");
    }
    return sum.add(batchPrice.mul(medicine.quantity));
  }, new Prisma.Decimal(0));
}

async function requireInvoicePaymentStatusUnpaidId(tx: Tx): Promise<string> {
  const row = await tx.lookup.findFirst({
    where: {
      lookupKey: "UNPAID",
      isActive: true,
      category: { categoryName: "INVOICE_PAYMENT_STATUS" },
    },
    select: { id: true },
  });
  if (!row) {
    throw new Error("Missing INVOICE_PAYMENT_STATUS/UNPAID lookup");
  }
  return row.id;
}

async function requireInvoiceTypeVisitId(tx: Tx): Promise<string> {
  const row = await tx.lookup.findFirst({
    where: {
      lookupKey: "VISIT",
      isActive: true,
      category: { categoryName: "INVOICE_TYPE" },
    },
    select: { id: true },
  });
  if (!row) {
    throw new Error("Missing INVOICE_TYPE/VISIT lookup");
  }
  return row.id;
}

/**
 * Creates a single unpaid invoice for a completed visit when none exists for the booking.
 * Idempotent per booking (safe if invoked again for the same booking in edge cases).
 */
export async function createVisitInvoiceIfAbsent(
  tx: Tx,
  params: {
    bookingId: string;
    patientId: string;
    medicines?: VisitInvoiceMedicineInput[];
    createdByUserId?: string | null;
  },
): Promise<{ invoiceId: string; created: boolean }> {
  const existing = await tx.visitInvoice.findUnique({
    where: { bookingId: params.bookingId },
    select: { invoiceId: true },
  });
  if (existing) {
    return { invoiceId: existing.invoiceId, created: false };
  }

  const paymentStatusId = await requireInvoicePaymentStatusUnpaidId(tx);
  const invoiceTypeId = await requireInvoiceTypeVisitId(tx);
  const consultationTotal = new Prisma.Decimal(0);
  const travelCost = new Prisma.Decimal(0);
  const medicineTotal = await computeMedicineSubtotal(tx, params.medicines ?? []);
  const latestSettings = await tx.companySettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { serviceCharges: true },
  });
  const serviceCharge = latestSettings?.serviceCharges ?? new Prisma.Decimal(0);
  // Invariant: generated bill total must equal persisted invoice total for visit completion.
  const totalAmount = consultationTotal.add(medicineTotal).add(travelCost).add(serviceCharge);
  const balanceDue = totalAmount;

  const inv = await tx.invoice.create({
    data: {
      invoiceTypeId,
      createdById: params.createdByUserId?.trim() || null,
      bookingId: params.bookingId,
      patientId: params.patientId,
      subscriptionAccountId: null,
      totalAmount,
      consultationTotal,
      medicineTotal,
      travelCost,
      serviceCharge,
      paidAmount: new Prisma.Decimal(0),
      balanceDue,
      paymentStatus: "Unpaid",
      paymentStatusId,
    },
  });

  await tx.visitInvoice.create({
    data: {
      invoiceId: inv.id,
      bookingId: params.bookingId,
      patientId: params.patientId,
    },
  });

  return { invoiceId: inv.id, created: true };
}
