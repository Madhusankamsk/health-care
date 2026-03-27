-- Alter Booking: optional team & schedule; doctor request fields
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_teamId_fkey";

ALTER TABLE "Booking" ALTER COLUMN "teamId" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "scheduledDate" DROP NOT NULL;

ALTER TABLE "Booking" ADD COLUMN "locationRemark" TEXT;
ALTER TABLE "Booking" ADD COLUMN "requestedDoctorId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "doctorStatusId" TEXT;

CREATE INDEX IF NOT EXISTS "Booking_requestedDoctorId_idx" ON "Booking"("requestedDoctorId");
CREATE INDEX IF NOT EXISTS "Booking_doctorStatusId_idx" ON "Booking"("doctorStatusId");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "MedicalTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requestedDoctorId_fkey" FOREIGN KEY ("requestedDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_doctorStatusId_fkey" FOREIGN KEY ("doctorStatusId") REFERENCES "Lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Dispatch (schema only)
CREATE TABLE "DispatchRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusId" TEXT,

    CONSTRAINT "DispatchRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DispatchAssignment" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isTeamLeader" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DispatchAssignment_dispatchId_idx" ON "DispatchAssignment"("dispatchId");
CREATE INDEX "DispatchAssignment_userId_idx" ON "DispatchAssignment"("userId");

ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "DispatchRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
