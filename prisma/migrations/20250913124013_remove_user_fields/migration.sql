/*
  Warnings:

  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `preferredFoot` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "phone",
DROP COLUMN "position",
DROP COLUMN "preferredFoot";
