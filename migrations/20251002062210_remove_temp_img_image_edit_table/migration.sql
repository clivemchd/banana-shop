/*
  Warnings:

  - You are about to drop the column `originalUrl` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the `ImageEdit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TempImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ImageEdit" DROP CONSTRAINT "ImageEdit_imageId_fkey";

-- DropForeignKey
ALTER TABLE "ImageEdit" DROP CONSTRAINT "ImageEdit_userId_fkey";

-- DropForeignKey
ALTER TABLE "TempImage" DROP CONSTRAINT "TempImage_userId_fkey";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "originalUrl";

-- DropTable
DROP TABLE "ImageEdit";

-- DropTable
DROP TABLE "TempImage";
