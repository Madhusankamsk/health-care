import prisma from "../prisma/client";
import { createPatientDispenseInTransaction } from "./inventoryService";
import { createVisitInvoiceIfAbsent } from "./visitInvoiceService";

export type VisitCompletionMedicineInput = {
  batchId: string;
  quantity: number;
  bookingId: string;
  patientId: string;
};

/**
 * Complete a visit for in-house nursing encounters (no dispatch). Reuses visit invoice
 * and dispense logic from the home-visit completion path.
 */
export async function completeNursingEncounterVisit(params: {
  bookingId: string;
  actorUserId: string;
  remark?: string | null;
  medicines?: VisitCompletionMedicineInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        bookingTypeLookup: { select: { lookupKey: true } },
        visitRecord: { select: { id: true, completedAt: true } },
      },
    });

    if (!booking) {
      const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
      err.code = "BOOKING_NOT_FOUND";
      throw err;
    }

    if (booking.bookingTypeLookup?.lookupKey !== "NURSING_ENCOUNTER") {
      const err = new Error("NOT_NURSING_ENCOUNTER") as Error & { code?: string };
      err.code = "NOT_NURSING_ENCOUNTER";
      throw err;
    }

    if (!booking.visitRecord) {
      const err = new Error("VISIT_NOT_FOUND") as Error & { code?: string };
      err.code = "VISIT_NOT_FOUND";
      throw err;
    }

    if (booking.visitRecord.completedAt) {
      const err = new Error("ALREADY_COMPLETED") as Error & { code?: string };
      err.code = "ALREADY_COMPLETED";
      throw err;
    }

    const visit = booking.visitRecord;

    for (const medicine of params.medicines ?? []) {
      if (medicine.bookingId !== booking.id || medicine.patientId !== booking.patientId) {
        const err = new Error("INVALID_MEDICINE_CONTEXT") as Error & { code?: string };
        err.code = "INVALID_MEDICINE_CONTEXT";
        throw err;
      }
      await createPatientDispenseInTransaction(tx, {
        batchId: medicine.batchId,
        quantity: medicine.quantity,
        bookingId: medicine.bookingId,
        patientId: medicine.patientId,
        transferredById: params.actorUserId,
        existingVisitId: visit.id,
      });
    }

    await tx.visitRecord.update({
      where: { id: visit.id },
      data: {
        completedAt: new Date(),
        ...(params.remark !== undefined ? { remark: params.remark } : {}),
      },
    });

    const { invoiceId } = await createVisitInvoiceIfAbsent(tx, {
      bookingId: booking.id,
      patientId: booking.patientId,
      createdByUserId: params.actorUserId,
    });

    return { visitInvoiceId: invoiceId };
  });
}
