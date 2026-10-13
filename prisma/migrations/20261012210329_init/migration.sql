-- CreateTable
CREATE TABLE "makes" (
    "makeId" INTEGER NOT NULL,
    "makeName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "makes_pkey" PRIMARY KEY ("makeId")
);
