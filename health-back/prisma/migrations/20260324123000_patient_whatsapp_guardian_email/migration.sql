-- AlterTable (idempotent: columns may already exist from db push or manual DDL)
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "whatsappNo" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "guardianEmail" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "guardianWhatsappNo" TEXT;
