import type { Request, Response } from "express";

import {
  createBooking,
  deleteBooking,
  getBookingById,
  listBookings,
  updateBooking,
} from "../services/bookingService";

export async function listBookingsHandler(_req: Request, res: Response) {
  const bookings = await listBookings();
  return res.json(bookings);
}

export async function getBookingHandler(req: Request, res: Response) {
  const { id } = req.params;
  const booking = await getBookingById(id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  return res.json(booking);
}

export async function createBookingHandler(req: Request, res: Response) {
  const { patientId, teamId, scheduledDate, status, locationGps } = req.body as Partial<{
    patientId: string;
    teamId: string;
    scheduledDate: string;
    status: string;
    locationGps: string | null;
  }>;

  const cleanedPatientId = patientId?.trim() ?? "";
  const cleanedTeamId = teamId?.trim() ?? "";
  const cleanedScheduledDate = scheduledDate?.trim() ?? "";

  if (!cleanedPatientId || !cleanedTeamId || !cleanedScheduledDate) {
    return res
      .status(400)
      .json({ message: "patientId, teamId and scheduledDate are required" });
  }

  try {
    const booking = await createBooking({
      patientId: cleanedPatientId,
      teamId: cleanedTeamId,
      scheduledDate: cleanedScheduledDate,
      status: status?.trim() ? status.trim() : undefined,
      locationGps: locationGps?.trim() ? locationGps.trim() : null,
    });
    return res.status(201).json(booking);
  } catch {
    return res.status(409).json({ message: "Unable to create booking" });
  }
}

export async function updateBookingHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { patientId, teamId, scheduledDate, status, locationGps } = req.body as Partial<{
    patientId: string;
    teamId: string;
    scheduledDate: string;
    status: string;
    locationGps: string | null;
  }>;

  try {
    const booking = await updateBooking(id, {
      patientId: typeof patientId === "string" ? patientId.trim() : undefined,
      teamId: typeof teamId === "string" ? teamId.trim() : undefined,
      scheduledDate: typeof scheduledDate === "string" ? scheduledDate.trim() : undefined,
      status: typeof status === "string" ? status.trim() : undefined,
      locationGps:
        locationGps === null ? null : typeof locationGps === "string" ? locationGps.trim() : undefined,
    });
    return res.json(booking);
  } catch {
    return res.status(409).json({ message: "Unable to update booking" });
  }
}

export async function deleteBookingHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await deleteBooking(id);
    return res.status(204).send();
  } catch {
    return res.status(409).json({ message: "Unable to delete booking. Remove linked records first." });
  }
}
