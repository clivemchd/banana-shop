/*
  Warnings:

  - You are about to drop the column `endDate` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "endDate",
ADD COLUMN     "billingEndDate" TIMESTAMP(3);
