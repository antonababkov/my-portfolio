-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "aboutExtraTitle" TEXT NOT NULL DEFAULT 'Обо мне';
ALTER TABLE "Profile" ADD COLUMN "aboutExtra" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Profile" ADD COLUMN "aboutExtraVisible" BOOLEAN NOT NULL DEFAULT false;