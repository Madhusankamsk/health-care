-- Ensure BOOKING_TYPE lookup category and values exist
INSERT INTO "LookupCategory" ("id", "categoryName")
SELECT gen_random_uuid()::text, 'BOOKING_TYPE'
WHERE NOT EXISTS (
  SELECT 1 FROM "LookupCategory" WHERE "categoryName" = 'BOOKING_TYPE'
);

WITH booking_type_category AS (
  SELECT "id" FROM "LookupCategory" WHERE "categoryName" = 'BOOKING_TYPE' LIMIT 1
)
INSERT INTO "Lookup" ("id", "categoryId", "lookupKey", "lookupValue", "isActive")
SELECT gen_random_uuid()::text, c."id", v.lookup_key, v.lookup_value, true
FROM booking_type_category c
CROSS JOIN (VALUES
  ('VISIT', 'Visit'),
  ('OPD', 'OPD')
) AS v(lookup_key, lookup_value)
WHERE NOT EXISTS (
  SELECT 1
  FROM "Lookup" l
  WHERE l."categoryId" = c."id"
    AND l."lookupKey" = v.lookup_key
);

-- Add lookup-backed booking type column
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bookingTypeId" TEXT;

-- Backfill from isOpd when present, otherwise default to VISIT
DO $$
DECLARE
  category_id TEXT;
  visit_id TEXT;
  opd_id TEXT;
  has_is_opd BOOLEAN;
BEGIN
  SELECT "id" INTO category_id FROM "LookupCategory" WHERE "categoryName" = 'BOOKING_TYPE' LIMIT 1;
  SELECT "id" INTO visit_id FROM "Lookup" WHERE "categoryId" = category_id AND "lookupKey" = 'VISIT' LIMIT 1;
  SELECT "id" INTO opd_id FROM "Lookup" WHERE "categoryId" = category_id AND "lookupKey" = 'OPD' LIMIT 1;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Booking'
      AND column_name = 'isOpd'
  ) INTO has_is_opd;

  IF has_is_opd THEN
    UPDATE "Booking"
    SET "bookingTypeId" = CASE
      WHEN "isOpd" = true THEN opd_id
      ELSE visit_id
    END
    WHERE "bookingTypeId" IS NULL;
  ELSE
    UPDATE "Booking"
    SET "bookingTypeId" = visit_id
    WHERE "bookingTypeId" IS NULL;
  END IF;
END $$;

ALTER TABLE "Booking" ALTER COLUMN "bookingTypeId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Booking_bookingTypeId_idx" ON "Booking"("bookingTypeId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_bookingTypeId_fkey') THEN
    ALTER TABLE "Booking"
      ADD CONSTRAINT "Booking_bookingTypeId_fkey"
      FOREIGN KEY ("bookingTypeId") REFERENCES "Lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Remove legacy boolean column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Booking'
      AND column_name = 'isOpd'
  ) THEN
    ALTER TABLE "Booking" DROP COLUMN "isOpd";
  END IF;
END $$;
