"use client";

import type { UpcomingBookingRow } from "@/components/dispatch/types";
import type { IssuedMedicineSampleRow } from "@/components/clients/patient-bookings/types";

type DispatchRecordRow = UpcomingBookingRow["dispatchRecords"][number];

export function safeFileKeySegment(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

/** Visit remark for current schema with fallback for legacy rows. */
export function diagnosisRemarkFromVisit(b: UpcomingBookingRow): string {
  const remark = b.visitRecord?.remark?.trim() ?? "";
  return remark;
}

export function inTransitDispatchForBooking(b: UpcomingBookingRow): DispatchRecordRow | null {
  return b.dispatchRecords.find((dr) => dr.statusLookup?.lookupKey === "IN_TRANSIT") ?? null;
}

export function arrivedDispatchForBooking(b: UpcomingBookingRow): DispatchRecordRow | null {
  return b.dispatchRecords.find((dr) => dr.statusLookup?.lookupKey === "ARRIVED") ?? null;
}

export function preferredDispatchForInventory(b: UpcomingBookingRow): DispatchRecordRow | null {
  return (
    arrivedDispatchForBooking(b) ?? inTransitDispatchForBooking(b) ?? b.dispatchRecords[0] ?? null
  );
}

/** Maps persisted visit dispensed medicines to the same row shape as the medicines tab / visit report. */
export function issuedMedicineRowsFromVisit(b: UpcomingBookingRow): IssuedMedicineSampleRow[] {
  const meds = b.visitRecord?.medicines;
  if (!meds?.length) return [];
  const collectedAt = b.visitRecord?.completedAt ?? b.scheduledDate ?? "";
  return meds.map((m) => {
    const batchNo = m.batch.batchNo?.trim() || "—";
    return {
      id: m.id,
      sampleType: m.medicine.name?.trim() || "Medicine",
      collectedAt,
      labName: `Issued qty ${m.quantity} from batch ${batchNo}`,
      statusLabel: "Issued",
    };
  });
}
