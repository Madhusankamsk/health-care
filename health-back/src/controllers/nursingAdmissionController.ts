import type { Request, Response } from "express";

import {
  admitPatient,
  appendDailyNote,
  dischargeAdmission,
  listActiveAdmissions,
  startNursingEncounter,
  updateCarePathway,
} from "../services/nursingAdmissionService";

export async function listActiveNursingAdmissionsHandler(_req: Request, res: Response) {
  const items = await listActiveAdmissions();
  return res.json({ items });
}

export async function admitNursingPatientHandler(req: Request, res: Response) {
  const { patientId, siteLabel, carePathwayKey } = req.body as Partial<{
    patientId: string;
    siteLabel: string | null;
    carePathwayKey: "OBSERVATION" | "TREATMENT";
  }>;

  const pid = patientId?.trim() ?? "";
  if (!pid) {
    return res.status(400).json({ message: "patientId is required" });
  }
  const pathway = carePathwayKey === "TREATMENT" ? "TREATMENT" : "OBSERVATION";

  try {
    const row = await admitPatient({
      patientId: pid,
      siteLabel: siteLabel ?? null,
      carePathwayKey: pathway,
    });
    return res.status(201).json(row);
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "PATIENT_NOT_FOUND") {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (err.code === "ALREADY_ADMITTED") {
      return res.status(409).json({ message: "Patient already has an active admission" });
    }
    return res.status(500).json({ message: err.message ?? "Unable to admit patient" });
  }
}

export async function appendNursingDailyNoteHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { note } = req.body as Partial<{ note: string }>;
  const userId = req.authUser?.sub?.trim();

  if (!id?.trim()) {
    return res.status(400).json({ message: "Admission id is required" });
  }
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const row = await appendDailyNote({
      nursingAdmissionId: id.trim(),
      recordedByUserId: userId,
      note: note ?? "",
    });
    return res.status(201).json(row);
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NOTE_REQUIRED") {
      return res.status(400).json({ message: "note is required" });
    }
    if (err.code === "ADMISSION_NOT_FOUND") {
      return res.status(404).json({ message: "Admission not found" });
    }
    if (err.code === "ADMISSION_CLOSED") {
      return res.status(409).json({ message: "Admission is not active" });
    }
    return res.status(500).json({ message: err.message ?? "Unable to save note" });
  }
}

export async function patchNursingCarePathwayHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { carePathwayKey } = req.body as Partial<{ carePathwayKey: "OBSERVATION" | "TREATMENT" }>;

  if (!id?.trim()) {
    return res.status(400).json({ message: "Admission id is required" });
  }

  const pathway = carePathwayKey === "TREATMENT" ? "TREATMENT" : "OBSERVATION";

  try {
    const row = await updateCarePathway({
      nursingAdmissionId: id.trim(),
      carePathwayKey: pathway,
    });
    return res.json(row);
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "ADMISSION_NOT_FOUND") {
      return res.status(404).json({ message: "Admission not found" });
    }
    if (err.code === "ADMISSION_CLOSED") {
      return res.status(409).json({ message: "Admission is not active" });
    }
    return res.status(500).json({ message: err.message ?? "Unable to update pathway" });
  }
}

export async function dischargeNursingAdmissionHandler(req: Request, res: Response) {
  const { id } = req.params;
  if (!id?.trim()) {
    return res.status(400).json({ message: "Admission id is required" });
  }

  try {
    const row = await dischargeAdmission(id.trim());
    return res.json(row);
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "ADMISSION_NOT_FOUND") {
      return res.status(404).json({ message: "Admission not found" });
    }
    if (err.code === "ADMISSION_CLOSED") {
      return res.status(409).json({ message: "Admission is already closed" });
    }
    return res.status(500).json({ message: err.message ?? "Unable to discharge" });
  }
}

export async function startNursingEncounterHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { requestedDoctorId, bookingRemark } = req.body as Partial<{
    requestedDoctorId: string | null;
    bookingRemark: string | null;
  }>;

  if (!id?.trim()) {
    return res.status(400).json({ message: "Admission id is required" });
  }

  try {
    const booking = await startNursingEncounter({
      nursingAdmissionId: id.trim(),
      requestedDoctorId: requestedDoctorId ?? undefined,
      bookingRemark: bookingRemark ?? undefined,
    });
    return res.status(201).json(booking);
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "ADMISSION_NOT_FOUND") {
      return res.status(404).json({ message: "Admission not found" });
    }
    if (err.code === "ADMISSION_CLOSED") {
      return res.status(409).json({ message: "Admission is not active" });
    }
    return res.status(500).json({ message: err.message ?? "Unable to start encounter" });
  }
}
