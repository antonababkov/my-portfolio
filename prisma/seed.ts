import "dotenv/config";
import bcrypt from "bcryptjs";
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
      sliderAutoPlay: false,
    },
  });

  await prisma.project.deleteMany({
    where: { id: { in: ["project-demo-1", "project-demo-2"] } },
  });

  const adminLogin = process.env.AUTH_ADMIN_LOGIN?.trim() || "";
  const adminPassword = process.env.AUTH_ADMIN_PASSWORD || "";

  // Fail-fast: не создаём админа с пустым/тривиальным паролем.
  if (!adminLogin) {
    throw new Error("AUTH_ADMIN_LOGIN не задан. Заполните .env (см. .env.example).");
  }
  if (
    !adminPassword ||
    adminPassword.length < 8 ||
    adminPassword === "admin123" ||
    adminPassword === "replace-with-strong-password"
  ) {
    throw new Error(
      "AUTH_ADMIN_PASSWORD не задан или слишком слабый (минимум 8 символов, не плейсхолдер). Заполните .env (см. .env.example)."
    );
  }

  await prisma.admin.upsert({
    where: { login: adminLogin },
    update: {},
    create: {
      login: adminLogin,
      password: await bcrypt.hash(adminPassword, 10),
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