-- Patient fields from later db diagram revisions; earlier placeholder migrations were empty.

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "shortName" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hasInsurance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hasGuardian" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "guardianName" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "guardianContactNo" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "guardianRelationship" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "billingRecipientId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Patient_billingRecipientId_fkey') THEN
    ALTER TABLE "Patient" ADD CONSTRAINT "Patient_billingRecipientId_fkey"
      FOREIGN KEY ("billingRecipientId") REFERENCES "Lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
