import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const profile = await prisma.profile.upsert({
    where: { id: "profile-default" },
    update: {},
    create: {
      id: "profile-default",
      fullName: "Иван Иванов",
      position: "Frontend-разработчик",
      description:
        "Разрабатываю современные веб-интерфейсы на Next.js и React. Люблю чистый код, доступный UX и производительность.",
    },
  });

  await prisma.project.upsert({
    where: { id: "project-demo-1" },
    update: {},
    create: {
      id: "project-demo-1",
      title: "Демо-проект",
      description: "Пример карточки проекта для портфолио.",
      link: "https://example.com",
      order: 0,
    },
  });

  console.log("Seed completed:", profile.fullName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });