-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "unit_price" DECIMAL(65,30),
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flights" (
    "id" SERIAL NOT NULL,
    "flight_number" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trolleys" (
    "id" SERIAL NOT NULL,
    "trolley_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'empty',
    "total_shelves" INTEGER NOT NULL DEFAULT 3,
    "assigned_at" TIMESTAMP(3),
    "flightId" INTEGER,

    CONSTRAINT "trolleys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" SERIAL NOT NULL,
    "shelf_number" INTEGER NOT NULL,
    "qr_code" TEXT,
    "position" TEXT,
    "trolleyId" INTEGER NOT NULL,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_requirements" (
    "id" SERIAL NOT NULL,
    "expected_quantity" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "flightId" INTEGER NOT NULL,
    "trolleyId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "flight_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" SERIAL NOT NULL,
    "image_path" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "metadata" JSONB,
    "trolleyId" INTEGER,
    "shelfId" INTEGER,
    "scannedBy" INTEGER,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_items" (
    "id" SERIAL NOT NULL,
    "detected_quantity" INTEGER NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "notes" TEXT,
    "scanId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "scan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "scanItemId" INTEGER NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "flights_flight_number_key" ON "flights"("flight_number");

-- CreateIndex
CREATE UNIQUE INDEX "trolleys_trolley_code_key" ON "trolleys"("trolley_code");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_qr_code_key" ON "shelves"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_trolleyId_shelf_number_key" ON "shelves"("trolleyId", "shelf_number");

-- CreateIndex
CREATE UNIQUE INDEX "flight_requirements_flightId_trolleyId_productId_key" ON "flight_requirements"("flightId", "trolleyId", "productId");

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_requirements" ADD CONSTRAINT "flight_requirements_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_requirements" ADD CONSTRAINT "flight_requirements_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_requirements" ADD CONSTRAINT "flight_requirements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "shelves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_items" ADD CONSTRAINT "scan_items_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_items" ADD CONSTRAINT "scan_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_scanItemId_fkey" FOREIGN KEY ("scanItemId") REFERENCES "scan_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
