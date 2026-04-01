"use client";

import { useState } from "react";

import type { UpcomingBookingRow } from "@/components/dispatch/types";
import type { InventoryBatchRow, IssuedMedicineSampleRow } from "@/components/clients/patient-bookings/types";
import { preferredDispatchForInventory } from "@/components/clients/patient-bookings/utils";
import { issueMedicineToPatientApi, listInventoryBatchesApi } from "@/lib/patientBookingsApi";
import { toast } from "@/lib/toast";

export function useInventoryIssue() {
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatchRow[] | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedBatchByBookingId, setSelectedBatchByBookingId] = useState<Record<string, string>>({});
  const [issueQtyByBookingId, setIssueQtyByBookingId] = useState<Record<string, string>>({});
  const [issuingBookingId, setIssuingBookingId] = useState<string | null>(null);
  const [issuedMedicineSamplesByBookingId, setIssuedMedicineSamplesByBookingId] = useState<
    Record<string, IssuedMedicineSampleRow[]>
  >({});
  const [pendingIssuesByBookingId, setPendingIssuesByBookingId] = useState<
    Record<string, Array<{ tempId: string; batchId: string; quantity: number }>>
  >({});

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
    const selectedBatch = teamLeaderBatchesForBooking(b).find((x) => x.id === batchId);
    if (!selectedBatch) {
      toast.error("Selected batch is unavailable.");
      return;
    }

    const tempId = `queued-${crypto.randomUUID()}`;
    setPendingIssuesByBookingId((prev) => ({
      ...prev,
      [b.id]: [...(prev[b.id] ?? []), { tempId, batchId, quantity }],
    }));
    const medicineName = selectedBatch.medicine?.name?.trim() || "Medicine";
    const batchNo = selectedBatch.batchNo?.trim() || "—";
    const queuedRow: IssuedMedicineSampleRow = {
      id: tempId,
      sampleType: medicineName,
      collectedAt: new Date().toISOString(),
      labName: `Queued qty ${quantity} from batch ${batchNo}`,
      statusLabel: "Queued",
    };
    setIssuedMedicineSamplesByBookingId((prev) => ({
      ...prev,
      [b.id]: [queuedRow, ...(prev[b.id] ?? [])],
    }));
    setIssueQtyByBookingId((prev) => ({ ...prev, [b.id]: "1" }));
    setSelectedBatchByBookingId((prev) => ({ ...prev, [b.id]: "" }));
    toast.success("Medicine added. It will be issued when visit is completed.");
  }

  function removePendingIssue(bookingId: string, queuedItemId: string) {
    setPendingIssuesByBookingId((prev) => ({
      ...prev,
      [bookingId]: (prev[bookingId] ?? []).filter((item) => item.tempId !== queuedItemId),
    }));
    setIssuedMedicineSamplesByBookingId((prev) => ({
      ...prev,
      [bookingId]: (prev[bookingId] ?? []).filter((item) => item.id !== queuedItemId),
    }));
  }

  async function persistPendingIssuesForBooking(b: UpcomingBookingRow): Promise<boolean> {
    const pending = pendingIssuesByBookingId[b.id] ?? [];
    if (pending.length === 0) return true;
    if (!b.patient?.id) {
      toast.error("Patient reference is missing for this booking.");
      return false;
    }
    setIssuingBookingId(b.id);
    try {
      for (const item of pending) {
        await issueMedicineToPatientApi({
          batchId: item.batchId,
          quantity: item.quantity,
          patientId: b.patient.id,
        });
      }
      setPendingIssuesByBookingId((prev) => {
        const next = { ...prev };
        delete next[b.id];
        return next;
      });
      setIssuedMedicineSamplesByBookingId((prev) => ({
        ...prev,
        [b.id]: [],
      }));
      setInventoryBatches(null);
      setInventoryError(null);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue queued medicines");
      return false;
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
    issuedMedicineSamplesByBookingId,
    ensureInventoryLoaded,
    teamLeaderBatchesForBooking,
    issueMedicineToPatient,
    persistPendingIssuesForBooking,
    removePendingIssue,
    setSelectedBatchByBookingId,
    setIssueQtyByBookingId,
  };
}
