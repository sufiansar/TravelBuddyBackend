-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TravelType" ADD VALUE 'ADVENTURE';
ALTER TYPE "TravelType" ADD VALUE 'BEACH';
ALTER TYPE "TravelType" ADD VALUE 'CITY_TOUR';
ALTER TYPE "TravelType" ADD VALUE 'CULTURAL';
ALTER TYPE "TravelType" ADD VALUE 'HIKING';
ALTER TYPE "TravelType" ADD VALUE 'ROAD_TRIP';
ALTER TYPE "TravelType" ADD VALUE 'SKI_SNOWBOARD';
ALTER TYPE "TravelType" ADD VALUE 'BACKPACKING';
ALTER TYPE "TravelType" ADD VALUE 'LUXURY';
ALTER TYPE "TravelType" ADD VALUE 'BUSINESS';
ALTER TYPE "TravelType" ADD VALUE 'COUPLE';
ALTER TYPE "TravelType" ADD VALUE 'OTHER';
