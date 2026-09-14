-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "siteTitle" TEXT NOT NULL DEFAULT 'Моё портфолио';
ALTER TABLE "Profile" ADD COLUMN "siteDescription" TEXT NOT NULL DEFAULT 'Личный сайт-портфолио';
ALTER TABLE "Profile" ADD COLUMN "email" TEXT NOT NULL DEFAULT 'hello@example.com';
ALTER TABLE "Profile" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '+7 (900) 000-00-00';
