import prisma from "../prisma/client";
import type { BookingListScope } from "./bookingService";

export async function saveVisitDraft(
  bookingId: string,
  data: { clinicalNotes?: string | null; diagnosis?: string | null },
  access?: { userId: string | undefined; scope: BookingListScope },
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      patientId: true,
      requestedDoctorId: true,
    },
  });

  if (!booking) {
    const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
    err.code = "BOOKING_NOT_FOUND";
    throw err;
  }

  if (
    access?.scope === "own" &&
    access.userId &&
    booking.requestedDoctorId !== access.userId
  ) {
    const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
    err.code = "BOOKING_NOT_FOUND";
    throw err;
  }

  return prisma.visitRecord.upsert({
    where: { bookingId },
    create: {
      bookingId,
      patientId: booking.patientId,
      clinicalNotes:
        data.clinicalNotes === undefined ? null : data.clinicalNotes,
      diagnosis: data.diagnosis === undefined ? null : data.diagnosis,
    },
    update: {
      ...(data.clinicalNotes !== undefined ? { clinicalNotes: data.clinicalNotes } : {}),
      ...(data.diagnosis !== undefined ? { diagnosis: data.diagnosis } : {}),
    },
  });
}
