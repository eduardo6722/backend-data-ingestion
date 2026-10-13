-- CreateTable
CREATE TABLE "vehicle_types" (
    "makeId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "typeName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("makeId","typeId")
);

-- AddForeignKey
ALTER TABLE "vehicle_types" ADD CONSTRAINT "vehicle_types_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("makeId") ON DELETE CASCADE ON UPDATE CASCADE;
