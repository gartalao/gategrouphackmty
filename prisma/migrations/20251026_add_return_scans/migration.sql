-- CreateTable
CREATE TABLE "return_scans" (
    "returnScanId" SERIAL NOT NULL,
    "scanId" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'recording',
    "trolleyId" INTEGER,
    "operatorId" INTEGER,

    CONSTRAINT "return_scans_pkey" PRIMARY KEY ("returnScanId")
);

-- CreateTable
CREATE TABLE "return_detections" (
    "returnDetectionId" SERIAL NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DECIMAL(5,4),
    "video_frame_id" TEXT,
    "returnScanId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "operatorId" INTEGER,

    CONSTRAINT "return_detections_pkey" PRIMARY KEY ("returnDetectionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_scans_scanId_key" ON "return_scans"("scanId");

-- CreateIndex
CREATE UNIQUE INDEX "return_detections_returnScanId_productId_detected_at_key" ON "return_detections"("returnScanId", "productId", "detected_at");

-- CreateIndex
CREATE INDEX "return_detections_returnScanId_idx" ON "return_detections"("returnScanId");

-- CreateIndex
CREATE INDEX "return_detections_productId_idx" ON "return_detections"("productId");

-- AddForeignKey
ALTER TABLE "return_scans" ADD CONSTRAINT "return_scans_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("scanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_scans" ADD CONSTRAINT "return_scans_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("trolleyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_scans" ADD CONSTRAINT "return_scans_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_detections" ADD CONSTRAINT "return_detections_returnScanId_fkey" FOREIGN KEY ("returnScanId") REFERENCES "return_scans"("returnScanId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_detections" ADD CONSTRAINT "return_detections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_detections" ADD CONSTRAINT "return_detections_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

