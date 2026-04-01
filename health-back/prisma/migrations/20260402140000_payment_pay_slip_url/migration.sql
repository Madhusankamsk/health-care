-- Optional proof-of-payment image URL for recorded invoice payments.
ALTER TABLE "Payment" ADD COLUMN "paySlipUrl" TEXT;
