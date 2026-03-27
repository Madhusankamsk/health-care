-- Remove booking.teamId + inverse relation cleanup
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_teamId_fkey";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "teamId";

