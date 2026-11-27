-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "socialLinks" JSONB NOT NULL DEFAULT '[]'::jsonb;
