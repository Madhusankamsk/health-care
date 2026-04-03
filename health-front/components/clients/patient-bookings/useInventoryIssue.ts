"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { UpcomingBookingRow } from "@/components/dispatch/types";
import type { InventoryBatchRow } from "@/components/clients/patient-bookings/types";
import { preferredDispatchForInventory } from "@/components/clients/patient-bookings/utils";
import { issueMedicineToPatientApi, listInventoryBatchesApi } from "@/lib/patientBookingsApi";
import { toast } from "@/lib/toast";

export function useInventoryIssue() {
  const router = useRouter();
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatchRow[] | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedBatchByBookingId, setSelectedBatchByBookingId] = useState<Record<string, string>>({});
  const [issueQtyByBookingId, setIssueQtyByBookingId] = useState<Record<string, string>>({});
  const [issuingBookingId, setIssuingBookingId] = useState<string | null>(null);

  async function ensureInventoryLoaded() {
    if (inventoryBatches !== null || inventoryError) return;
    try {
      const batches = await listInventoryBatchesApi();
      setInventoryBatches(batches);
    } catch (e) {
      setInventoryError(e instanceof Error ? e.message : "Could not load team inventory");
    }
  }

  function teamLeaderBatchesForBooking(b: UpcomingBookingRow) {
    if (!inventoryBatches) return [];
    const sourceDispatch = preferredDispatchForInventory(b);
    const leadUserId = sourceDispatch?.assignments.find((a) => a.isTeamLeader)?.user.id;
    if (!leadUserId) return [];
    return inventoryBatches
      .filter(
        (batch) =>
          batch.locationId === leadUserId &&
          batch.quantity > 0 &&
          (batch.locationType === "NURSE" || batch.locationType === "USER"),
      )
      .sort((a, z) => new Date(a.expiryDate).getTime() - new Date(z.expiryDate).getTime());
  }

  async function issueMedicineToPatient(b: UpcomingBookingRow) {
    const batchId = selectedBatchByBookingId[b.id];
    const qtyText = issueQtyByBookingId[b.id] ?? "1";
    const quantity = Number.parseInt(qtyText, 10);
    if (!batchId) {
      toast.error("Select a medicine batch.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    if (!b.patient?.id) {
      toast.error("Patient reference is missing for this booking.");
      return;
    }

    setIssuingBookingId(b.id);
    try {
      await issueMedicineToPatientApi({
        batchId,
        quantity,
        patientId: b.patient.id,
        bookingId: b.id,
      });

      toast.success("Medicine issued to patient.");
      setIssueQtyByBookingId((prev) => ({ ...prev, [b.id]: "1" }));
      setSelectedBatchByBookingId((prev) => ({ ...prev, [b.id]: "" }));
      setInventoryBatches(null);
      setInventoryError(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue medicine");
    } finally {
      setIssuingBookingId(null);
    }
  }

  return {
    inventoryBatches,
    inventoryError,
    selectedBatchByBookingId,
    issueQtyByBookingId,
    issuingBookingId,
    ensureInventoryLoaded,
    teamLeaderBatchesForBooking,
    issueMedicineToPatient,
    setSelectedBatchByBookingId,
    setIssueQtyByBookingId,
  };
}
