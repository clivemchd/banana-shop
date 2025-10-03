/*
  Warnings:

  - Added the required column `size` to the `TempImage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TempImage" DROP CONSTRAINT "TempImage_userId_fkey";

-- AlterTable
ALTER TABLE "TempImage" ADD COLUMN     "size" INTEGER NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TempImage" ADD CONSTRAINT "TempImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
