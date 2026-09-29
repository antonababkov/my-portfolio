-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "privacyPolicy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Profile" ADD COLUMN "personalDataPolicy" TEXT NOT NULL DEFAULT '';