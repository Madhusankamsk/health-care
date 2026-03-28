-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "paymentPurposeId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_paymentPurposeId_idx" ON "Payment"("paymentPurposeId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentPurposeId_fkey" FOREIGN KEY ("paymentPurposeId") REFERENCES "Lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
