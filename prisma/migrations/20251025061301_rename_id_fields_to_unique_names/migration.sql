/*
  Warnings:

  - The primary key for the `alerts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `alerts` table. All the data in the column will be lost.
  - The primary key for the `flight_requirements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `flight_requirements` table. All the data in the column will be lost.
  - The primary key for the `flights` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `flights` table. All the data in the column will be lost.
  - The primary key for the `products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `products` table. All the data in the column will be lost.
  - The primary key for the `scan_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `scan_items` table. All the data in the column will be lost.
  - The primary key for the `scans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `scans` table. All the data in the column will be lost.
  - The primary key for the `shelves` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `shelves` table. All the data in the column will be lost.
  - The primary key for the `trolleys` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `trolleys` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_scanItemId_fkey";

-- DropForeignKey
ALTER TABLE "flight_requirements" DROP CONSTRAINT "flight_requirements_flightId_fkey";

-- DropForeignKey
ALTER TABLE "flight_requirements" DROP CONSTRAINT "flight_requirements_productId_fkey";

-- DropForeignKey
ALTER TABLE "flight_requirements" DROP CONSTRAINT "flight_requirements_trolleyId_fkey";

-- DropForeignKey
ALTER TABLE "scan_items" DROP CONSTRAINT "scan_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "scan_items" DROP CONSTRAINT "scan_items_scanId_fkey";

-- DropForeignKey
ALTER TABLE "scans" DROP CONSTRAINT "scans_scannedBy_fkey";

-- DropForeignKey
ALTER TABLE "scans" DROP CONSTRAINT "scans_shelfId_fkey";

-- DropForeignKey
ALTER TABLE "scans" DROP CONSTRAINT "scans_trolleyId_fkey";

-- DropForeignKey
ALTER TABLE "shelves" DROP CONSTRAINT "shelves_trolleyId_fkey";

-- DropForeignKey
ALTER TABLE "trolleys" DROP CONSTRAINT "trolleys_flightId_fkey";

-- AlterTable
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_pkey",
DROP COLUMN "id",
ADD COLUMN     "alertId" SERIAL NOT NULL,
ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("alertId");

-- AlterTable
ALTER TABLE "flight_requirements" DROP CONSTRAINT "flight_requirements_pkey",
DROP COLUMN "id",
ADD COLUMN     "requirementId" SERIAL NOT NULL,
ADD CONSTRAINT "flight_requirements_pkey" PRIMARY KEY ("requirementId");

-- AlterTable
ALTER TABLE "flights" DROP CONSTRAINT "flights_pkey",
DROP COLUMN "id",
ADD COLUMN     "flightId" SERIAL NOT NULL,
ADD CONSTRAINT "flights_pkey" PRIMARY KEY ("flightId");

-- AlterTable
ALTER TABLE "products" DROP CONSTRAINT "products_pkey",
DROP COLUMN "id",
ADD COLUMN     "productId" SERIAL NOT NULL,
ADD CONSTRAINT "products_pkey" PRIMARY KEY ("productId");

-- AlterTable
ALTER TABLE "scan_items" DROP CONSTRAINT "scan_items_pkey",
DROP COLUMN "id",
ADD COLUMN     "scanItemId" SERIAL NOT NULL,
ADD CONSTRAINT "scan_items_pkey" PRIMARY KEY ("scanItemId");

-- AlterTable
ALTER TABLE "scans" DROP CONSTRAINT "scans_pkey",
DROP COLUMN "id",
ADD COLUMN     "scanId" SERIAL NOT NULL,
ADD CONSTRAINT "scans_pkey" PRIMARY KEY ("scanId");

-- AlterTable
ALTER TABLE "shelves" DROP CONSTRAINT "shelves_pkey",
DROP COLUMN "id",
ADD COLUMN     "shelfId" SERIAL NOT NULL,
ADD CONSTRAINT "shelves_pkey" PRIMARY KEY ("shelfId");

-- AlterTable
ALTER TABLE "trolleys" DROP CONSTRAINT "trolleys_pkey",
DROP COLUMN "id",
ADD COLUMN     "trolleyId" SERIAL NOT NULL,
ADD CONSTRAINT "trolleys_pkey" PRIMARY KEY ("trolleyId");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "userId" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("userId");

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("flightId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("trolleyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_requirements" ADD CONSTRAINT "flight_requirements_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("flightId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_requirements" ADD CONSTRAINT "flight_requirements_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("trolleyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_requirements" ADD CONSTRAINT "flight_requirements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("trolleyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "shelves"("shelfId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_items" ADD CONSTRAINT "scan_items_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("scanId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_items" ADD CONSTRAINT "scan_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_scanItemId_fkey" FOREIGN KEY ("scanItemId") REFERENCES "scan_items"("scanItemId") ON DELETE RESTRICT ON UPDATE CASCADE;
