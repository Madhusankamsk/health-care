-- CreateTable
CREATE TABLE "NursingAdmission" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "siteLabel" TEXT,
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "statusId" TEXT NOT NULL,
    "carePathwayId" TEXT NOT NULL,

    CONSTRAINT "NursingAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingDailyNote" (
    "id" TEXT NOT NULL,
    "nursingAdmissionId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "NursingDailyNote_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "nursingAdmissionId" TEXT;

-- CreateIndex
CREATE INDEX "NursingAdmission_patientId_idx" ON "NursingAdmission"("patientId");

-- CreateIndex
CREATE INDEX "NursingAdmission_statusId_idx" ON "NursingAdmission"("statusId");

-- CreateIndex
CREATE INDEX "NursingDailyNote_nursingAdmissionId_idx" ON "NursingDailyNote"("nursingAdmissionId");

-- CreateIndex
CREATE INDEX "Booking_nursingAdmissionId_idx" ON "Booking"("nursingAdmissionId");

-- AddForeignKey
ALTER TABLE "NursingAdmission" ADD CONSTRAINT "NursingAdmission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingAdmission" ADD CONSTRAINT "NursingAdmission_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingAdmission" ADD CONSTRAINT "NursingAdmission_carePathwayId_fkey" FOREIGN KEY ("carePathwayId") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingDailyNote" ADD CONSTRAINT "NursingDailyNote_nursingAdmissionId_fkey" FOREIGN KEY ("nursingAdmissionId") REFERENCES "NursingAdmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingDailyNote" ADD CONSTRAINT "NursingDailyNote_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_nursingAdmissionId_fkey" FOREIGN KEY ("nursingAdmissionId") REFERENCES "NursingAdmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
