import prisma from "../prisma/client";
import type { BookingListScope } from "./bookingService";
import { ensureVisitRecordForBooking } from "./visitService";

const LAB_SAMPLE_STATUS_CATEGORY = "LAB_SAMPLE_STATUS";
const LAB_SAMPLE_TYPE_CATEGORY = "LAB_SAMPLE_TYPE";

async function resolveSampleTypeFromLookupId(lookupId: string): Promise<string> {
  const trimmed = lookupId.trim();
  if (!trimmed) {
    const err = new Error("INVALID_INPUT") as Error & { code?: string };
    err.code = "INVALID_INPUT";
    throw err;
  }
  const row = await prisma.lookup.findFirst({
    where: {
      id: trimmed,
      isActive: true,
      category: { categoryName: LAB_SAMPLE_TYPE_CATEGORY },
    },
    select: { lookupValue: true },
  });
  if (!row?.lookupValue?.trim()) {
    const err = new Error("INVALID_SAMPLE_TYPE") as Error & { code?: string };
    err.code = "INVALID_SAMPLE_TYPE";
    throw err;
  }
  return row.lookupValue.trim().slice(0, 200);
}

/** New samples in the collecting workflow always use COLLECTED (lookup); not client-settable. */
async function labSampleCollectedStatusId(): Promise<string | null> {
  const row = await prisma.lookup.findFirst({
    where: {
      category: { categoryName: LAB_SAMPLE_STATUS_CATEGORY },
      lookupKey: "COLLECTED",
      isActive: true,
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function createDiagnosticReportForBooking(
  bookingId: string,
  data: { reportName: string; fileUrl: string },
  userId: string,
  access: { userId: string | undefined; scope: BookingListScope },
) {
  const visit = await ensureVisitRecordForBooking(bookingId, access);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { patientId: true },
  });
  if (!booking) {
    const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
    err.code = "BOOKING_NOT_FOUND";
    throw err;
  }

  const reportName = data.reportName.trim().slice(0, 500);
  const fileUrl = data.fileUrl.trim();
  if (!reportName || !fileUrl) {
    const err = new Error("INVALID_INPUT") as Error & { code?: string };
    err.code = "INVALID_INPUT";
    throw err;
  }

  return prisma.diagnosticReport.create({
    data: {
      patientId: booking.patientId,
      visitId: visit.id,
      reportName,
      fileUrl,
      uploadedById: userId,
    },
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
    },
  });
}

export async function createLabSampleForBooking(
  bookingId: string,
  data: { sampleTypeLookupId: string; labName: string },
  userId: string,
  access: { userId: string | undefined; scope: BookingListScope },
) {
  const visit = await ensureVisitRecordForBooking(bookingId, access);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { patientId: true },
  });
  if (!booking) {
    const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
    err.code = "BOOKING_NOT_FOUND";
    throw err;
  }

  const sampleType = await resolveSampleTypeFromLookupId(data.sampleTypeLookupId);

  const trimmedDescription = data.labName.trim();
  if (!trimmedDescription) {
    const err = new Error("Description is required") as Error & { code?: string };
    err.code = "MISSING_DESCRIPTION";
    throw err;
  }
  const labName = trimmedDescription.slice(0, 200);

  const resolvedStatusId = await labSampleCollectedStatusId();

  return prisma.labSample.create({
    data: {
      patientId: booking.patientId,
      visitId: visit.id,
      sampleType,
      collectedById: userId,
      labName,
      statusId: resolvedStatusId,
    },
    include: {
      statusLookup: { select: { id: true, lookupKey: true, lookupValue: true } },
    },
  });
}

export async function deleteLabSampleForBooking(
  bookingId: string,
  sampleId: string,
  access: { userId: string | undefined; scope: BookingListScope },
) {
  const sample = await prisma.labSample.findUnique({
    where: { id: sampleId },
    include: {
      visit: { select: { bookingId: true } },
    },
  });

  if (!sample?.visit) {
    const err = new Error("SAMPLE_NOT_FOUND") as Error & { code?: string };
    err.code = "SAMPLE_NOT_FOUND";
    throw err;
  }
  if (sample.visit.bookingId !== bookingId) {
    const err = new Error("SAMPLE_NOT_FOUND") as Error & { code?: string };
    err.code = "SAMPLE_NOT_FOUND";
    throw err;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { requestedDoctorId: true },
  });
  if (!booking) {
    const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
    err.code = "BOOKING_NOT_FOUND";
    throw err;
  }
  if (access.scope === "own" && access.userId && booking.requestedDoctorId !== access.userId) {
    const err = new Error("BOOKING_NOT_FOUND") as Error & { code?: string };
    err.code = "BOOKING_NOT_FOUND";
    throw err;
  }

  await prisma.labSample.delete({ where: { id: sampleId } });
}
