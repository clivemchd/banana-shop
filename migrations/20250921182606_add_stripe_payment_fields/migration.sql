/*
  Warnings:

  - A unique constraint covering the columns `[paymentProcessorUserId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "datePaid" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "paymentProcessorUserId" TEXT,
ADD COLUMN     "subscriptionPlan" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_paymentProcessorUserId_key" ON "Users"("paymentProcessorUserId");
