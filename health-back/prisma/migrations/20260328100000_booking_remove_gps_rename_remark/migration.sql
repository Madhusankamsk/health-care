-- Remove GPS; rename location remark to booking_remark
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "locationGps";
ALTER TABLE "Booking" RENAME COLUMN "locationRemark" TO "bookingRemark";
