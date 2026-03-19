import prisma from "../prisma/client";

type BookingPayload = {
  patientId: string;
  teamId: string;
  scheduledDate: string | Date;
  status?: string;
  locationGps?: string | null;
};

function parseScheduledDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid scheduledDate");
  }
  return date;
}

export async function listBookings() {
  return prisma.booking.findMany({
    orderBy: { scheduledDate: "desc" },
    include: {
      patient: { select: { id: true, fullName: true, nicOrPassport: true, contactNo: true } },
      team: { select: { id: true, teamName: true } },
    },
  });
}

export async function getBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, fullName: true, nicOrPassport: true, contactNo: true } },
      team: { select: { id: true, teamName: true } },
    },
  });
}

export async function createBooking(data: BookingPayload) {
  return prisma.booking.create({
    data: {
      patientId: data.patientId,
      teamId: data.teamId,
      scheduledDate: parseScheduledDate(data.scheduledDate),
      status: data.status ?? "Pending",
      locationGps: data.locationGps ?? null,
    },
    include: {
      patient: { select: { id: true, fullName: true, nicOrPassport: true, contactNo: true } },
      team: { select: { id: true, teamName: true } },
    },
  });
}

export async function updateBooking(
  id: string,
  data: {
    patientId?: string;
    teamId?: string;
    scheduledDate?: string | Date;
    status?: string;
    locationGps?: string | null;
  },
) {
  return prisma.booking.update({
    where: { id },
    data: {
      patientId: data.patientId,
      teamId: data.teamId,
      scheduledDate:
        data.scheduledDate === undefined ? undefined : parseScheduledDate(data.scheduledDate),
      status: data.status,
      locationGps: data.locationGps,
    },
    include: {
      patient: { select: { id: true, fullName: true, nicOrPassport: true, contactNo: true } },
      team: { select: { id: true, teamName: true } },
    },
  });
}

export async function deleteBooking(id: string) {
  return prisma.booking.delete({ where: { id } });
}
