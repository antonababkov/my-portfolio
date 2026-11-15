-- Фото принадлежит проекту: при удалении проекта удаляем и записи Photo.
-- Файлы удаляются приложением (src/app/api/projects/[id]/route.ts).
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_projectId_fkey";

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
