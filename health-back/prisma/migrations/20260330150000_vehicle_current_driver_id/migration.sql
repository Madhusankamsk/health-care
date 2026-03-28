-- Vehicle.currentDriverId was intended in db_diagram_v32_* migrations but those shipped empty.

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "currentDriverId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vehicle_currentDriverId_fkey') THEN
    ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_currentDriverId_fkey"
      FOREIGN KEY ("currentDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
