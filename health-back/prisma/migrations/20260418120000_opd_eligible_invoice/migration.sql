-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "isOpd" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Booking_isOpd_idx" ON "Booking"("isOpd");

-- AlterTable
ALTER TABLE "OpdQueue" ADD COLUMN "bookingId" TEXT;
ALTER TABLE "OpdQueue" ADD COLUMN "pickedByUserId" TEXT;
ALTER TABLE "OpdQueue" ADD COLUMN "pickedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OpdEligibleDoctor" (
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpdEligibleDoctor_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "OpdInvoice" (
    "invoiceId" TEXT NOT NULL,
    "opdQueueId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "patientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpdInvoice_pkey" PRIMARY KEY ("invoiceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpdInvoice_opdQueueId_key" ON "OpdInvoice"("opdQueueId");

-- CreateIndex
CREATE UNIQUE INDEX "OpdInvoice_bookingId_key" ON "OpdInvoice"("bookingId");

-- CreateIndex
CREATE INDEX "OpdInvoice_patientId_idx" ON "OpdInvoice"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "OpdQueue_bookingId_key" ON "OpdQueue"("bookingId");

-- CreateIndex
CREATE INDEX "OpdQueue_pickedByUserId_idx" ON "OpdQueue"("pickedByUserId");

-- AddForeignKey
ALTER TABLE "OpdEligibleDoctor" ADD CONSTRAINT "OpdEligibleDoctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdInvoice" ADD CONSTRAINT "OpdInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdInvoice" ADD CONSTRAINT "OpdInvoice_opdQueueId_fkey" FOREIGN KEY ("opdQueueId") REFERENCES "OpdQueue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdInvoice" ADD CONSTRAINT "OpdInvoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdInvoice" ADD CONSTRAINT "OpdInvoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdQueue" ADD CONSTRAINT "OpdQueue_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdQueue" ADD CONSTRAINT "OpdQueue_pickedByUserId_fkey" FOREIGN KEY ("pickedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
