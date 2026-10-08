import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Cost bcrypt для хеша пароля админа. Держите в синхроне с DUMMY_HASH
// в src/app/api/auth/login/route.ts — иначе сломается выравнивание
// времени ответа на «пользователь есть/нет».
const BCRYPT_COST = 12;

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

  const existingAdmin = await prisma.admin.findUnique({
    where: { login: adminLogin },
  });

  if (existingAdmin) {
    // Повышаем cost хеша, если он ниже целевого (админ создан раньше,
    // например со cost 10). AUTH_ADMIN_PASSWORD из .env — источник истины
    // для учётных данных (см. README), поэтому замена хеша безопасна.
    // При cost >= BCRYPT_COST пароль не перезаписываем — чужие ручные
    // изменения сохраняются.
    const costMatch = /^\$2[aby]\$(\d+)\$/.exec(existingAdmin.password);
    const currentCost = costMatch ? Number(costMatch[1]) : 0;
    if (currentCost < BCRYPT_COST) {
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { password: await bcrypt.hash(adminPassword, BCRYPT_COST) },
      });
      console.log(
        `Admin hash upgraded: cost ${currentCost} -> ${BCRYPT_COST}`
      );
    }
  } else {
    await prisma.admin.create({
      data: {
        login: adminLogin,
        password: await bcrypt.hash(adminPassword, BCRYPT_COST),
      },
    });
  }

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