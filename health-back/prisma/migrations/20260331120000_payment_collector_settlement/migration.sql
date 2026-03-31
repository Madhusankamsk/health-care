-- Track end-of-day settlement per collector and payment method.
CREATE TABLE "PaymentCollectorSettlement" (
  "id" TEXT NOT NULL,
  "collectorId" TEXT NOT NULL,
  "settledDate" TIMESTAMP(3) NOT NULL,
  "paymentMethodKey" TEXT NOT NULL,
  "totalAmountAtSettle" DECIMAL(65,30) NOT NULL,
  "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settledById" TEXT,
  CONSTRAINT "PaymentCollectorSettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentCollectorSettlement_collectorId_settledDate_paymentMethodKey_key"
ON "PaymentCollectorSettlement"("collectorId", "settledDate", "paymentMethodKey");

CREATE INDEX "PaymentCollectorSettlement_settledDate_idx"
ON "PaymentCollectorSettlement"("settledDate");

CREATE INDEX "PaymentCollectorSettlement_paymentMethodKey_idx"
ON "PaymentCollectorSettlement"("paymentMethodKey");

ALTER TABLE "PaymentCollectorSettlement"
ADD CONSTRAINT "PaymentCollectorSettlement_collectorId_fkey"
FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentCollectorSettlement"
ADD CONSTRAINT "PaymentCollectorSettlement_settledById_fkey"
FOREIGN KEY ("settledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
