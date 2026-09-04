# My Portfolio

Личное портфолио на **Next.js 16**, **React 19** и **Prisma 7** с админ-панелью и полным Docker-развёртыванием. Быстрый, доступный (AA-контраст, focus-trap, skip-link), адаптивный и оптимизированный под скорость (Lighthouse ~96-100).

---

## Стек

| Слой               | Технологии                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| Frontend           | Next.js 16.3.4 (App Router, Turbopack, standalone), React 19.2.8, SCSS       |
| Backend / API      | Next.js Route Handlers, zod-валидация                                        |
| ORM                | Prisma 7 (`prisma-client` + `@prisma/adapter-pg`) + PostgreSQL 16            |
| Авторизация        | JWT (httpOnly-cookie) + bcryptjs                                             |
| Файлы              | `sharp`, загрузка в `/uploads`, immutable Cache-Control                      |
| Dev-инфраструктура | TypeScript 5, ESLint 9, Autoprefixer                                         |
| Деплой             | Docker multi-stage + docker-compose (db / migrate / app), Caddy (авто-HTTPS) |

---

## Возможности

- **Главная страница** — профиль, фото-слайдер, карточки проектов, тема light/dark.
- **Админ-панель** `/admin` — редактирование «О себе», проектов, фото (загрузка/удаление), выход.
- **Авторизация** — JWT в httpOnly-куки, `bcryptjs`, защищённые API-роуты (`api/auth/me`).
- **SEO/доступность** — `robots.txt`, `sitemap.xml`, Open Graph, skip-link, focus-trap, контрасты AA.
- **Производительность** — `next/image` + `sizes`/`priority`, `next/dynamic` для админ-форм, `sharp`.

---

## Структура проекта

```
my-portfolio/
├─ docker/
│  ├─ Dockerfile           # multi-stage: deps → builder → migrator → runner (standalone)
│  ├─ docker-compose.yml   # db / migrate / app
│  └─ Caddyfile            # reverse-proxy + автоматический HTTPS
├─ prisma/
│  ├─ schema.prisma        # модели Profile, Photo, Project, Admin
│  ├─ migrations/          # SQL-миграции
│  └─ seed.ts              # демо-данные + создание админа
├─ src/
│  ├─ app/                 # App Router (страницы, Route Handlers: api/auth, api/profile, api/projects, api/photos, api/upload)
│  ├─ components/          # home/, admin/, ui/, footer/
│  ├─ lib/                 # db.ts, auth.ts, api.ts, constants.ts, theme.ts, csrf.ts, rate-limit.ts
│  └─ generated/prisma/    # сгенерированный Prisma-клиент (не редактировать)
├─ public/uploads/         # загруженные изображения
├─ .env.example            # шаблон переменных окружения
├─ prisma7.config.ts       # конфиг Prisma v7 (schema, миграции, seed)
├─ next.config.ts          # output: "standalone", Cache-Control headers
└─ package.json
```

---

## Требования

- Node.js 20+ (локальная разработка)
- PostgreSQL 14+ (локально) **или** Docker + Docker Compose (рекомендуется)

---

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.

```env
# PostgreSQL
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=replace-with-strong-password
POSTGRES_DB=portfolio

# URL подключения (нужен для Prisma)
DATABASE_URL="postgresql://portfolio:replace-with-strong-password@localhost:5432/portfolio"

# Админ, создаётся при seed
AUTH_ADMIN_LOGIN=admin
AUTH_ADMIN_PASSWORD=replace-with-strong-password

# JWT-секрет (обязателен): openssl rand -hex 64
AUTH_SECRET=replace-with-64-hex-chars

# Публичный URL
SITE_URL=http://localhost:3000
```

> **Важно:** `AUTH_ADMIN_PASSWORD` и `AUTH_SECRET` задаются один раз при первом запуске. Сид создаёт админа только если его ещё нет (upsert `create`). Смена пароля в `.env` после первого seed **не** обновит существующего админа — для смены нужно обновить пароль через БД или пересоздать контейнер с чистыми volumes.

---

## Запуск (Docker — рекомендовано)

```bash
# 1. Настроить окружение
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
# и заполнить значения

# 2. Собрать и поднять весь стек (db → migrate → app)
docker compose --env-file .env -f docker/docker-compose.yml up -d --build

# 3. Проверка
docker compose -f docker/docker-compose.yml logs migrate   # "Seed completed: ..."
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000   # 200
# Windows PowerShell: (Invoke-WebRequest -Uri http://localhost:3000).StatusCode
```

Приложение доступно на `http://localhost:3000`. Админ-панель — `http://localhost:3000/admin`, вход по `AUTH_ADMIN_LOGIN` / `AUTH_ADMIN_PASSWORD`.

### Что делает команда развёртывания

- **db** — PostgreSQL 16, volume `db-data`, healthcheck `pg_isready`.
- **migrate** — применяет миграции (`prisma migrate deploy`) и запускает seed (создаёт профиль, демо-проекты и админа). Работает один раз, `restart: "no"`.
- **app** — standalone-сборка Next.js, volume `uploads`, порт `127.0.0.1:3000`.

### HTTPS (Caddy)

`docker/Caddyfile` — обратный прокси с автоматическим HTTPS (Let's Encrypt). Подмените `example.com` на ваш домен и прокидывайте трафик к `127.0.0.1:3000`.

---

## Запуск (локальная разработка)

### 1. Установить зависимости

```bash
npm install
```

### 2. Создать пользователя и базу PostgreSQL

Подключитесь к PostgreSQL от имени суперпользователя (`postgres`):

```bash
psql -U postgres
```

Выполните SQL-команды:

```sql
-- Создать пользователя и базу данных
CREATE USER portfolio WITH PASSWORD 'replace-with-strong-password';
CREATE DATABASE portfolio OWNER portfolio;

-- Выдать право на создание баз (нужно для Prisma shadow database)
ALTER USER portfolio CREATEDB;

\q
```

### 3. Настроить переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения. Убедитесь, что `DATABASE_URL` совпадает с данными PostgreSQL:

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

### 4. Применить миграции и сид

```bash
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
```

### 5. Запустить dev-сервер

```bash
npm run dev
```

Откройте `http://localhost:3000`.

### Скрипты

```bash
npm run dev       # dev-сервер (Next.js)
npm run build     # production-сборка (standalone)
npm run start     # запуск production-сборки
npm run lint      # ESLint
npx tsc --noEmit  # проверка типов
```

> **Примечание:** если во время разработки отключён Docker и порт `3000` уже занят, остановите лишние процессы, чтобы избежать «затенения» порта (см. раздел «Траблшутинг»).

---

## Docker-образ (Dockerfile)

Multi-stage сборка:

1. `deps` — установка зависимостей `npm install`.
2. `builder` — `prisma generate` + `npm run build` (Next standalone).
3. `migrator` — лёгкий слой с Prisma CLI + `openssl`; применяет миграции и сид (запускается от root для прав на engines).
4. `runner` — минимальный runtime `node server.js` от пользователя `nextjs`, volume `uploads`.

Нативные модули (`sharp`, `pg`) требуют `node:22-slim` (не alpine).

---

## API

| Метод  | Путь                 | Описание                             |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/api/auth/login`    | Вход, выдача JWT в httpOnly-куки     |
| GET    | `/api/auth/me`       | Текущий админ по токену (защищённый) |
| POST   | `/api/auth/logout`   | Выход, удаление куки                 |
| GET    | `/api/profile`       | Профиль (публичный)                  |
| PUT    | `/api/profile`       | Редактирование профиля (админ)       |
| GET    | `/api/projects`      | Список проектов (публичный)          |
| POST   | `/api/projects`      | Создание проекта (админ)             |
| PUT    | `/api/projects/[id]` | Обновление проекта (админ)           |
| DELETE | `/api/projects/[id]` | Удаление проекта (админ)             |
| POST   | `/api/photos`        | Добавление фото (админ)              |
| PUT    | `/api/photos`        | Обновление порядка/alt фото (админ)  |
| PATCH  | `/api/photos/[id]`   | Обновление фото (админ)              |
| DELETE | `/api/photos/[id]`   | Удаление фото (админ)                |
| POST   | `/api/upload`        | Загрузка файла в `/uploads` (админ)  |

---

## База данных (Prisma)

Модели (`prisma/schema.prisma`):

- **Profile** — имя, должность, описание.
- **Project** — заголовок, описание, ссылка, порядок.
- **Photo** — фото профиля или проекта, alt, порядок.
- **Admin** — логин + bcrypt-хэш пароля для входа в админ-панель.

Генерация клиента из приложения: `src/generated/prisma`. Конфиг Prisma v7 в `prisma7.config.ts` (**не** `prisma.config.ts`).

---

## Траблшутинг

- **`localhost:3000` отвечает неправильное приложение** — порт может «перекрываться» запущенным отдельно `next dev`. Проверьте, какой процесс слушает 3000: `netstat -ano | findstr :3000` (Windows) или `lsof -i :3000` (Linux/macOS). Остановите лишний dev-сервер, оставив только Docker-проки.
- **Логин возвращает 401 сразу после первого запуска** — проверьте, что `AUTH_ADMIN_LOGIN`/`AUTH_ADMIN_PASSWORD` дошли до `migrate`-контейнера, и что админ действительно создан при seed (`docker compose logs migrate`).
- **Смена пароля админа** не применяется после повторного запуска — сид не перезаписывает существующего админа. Обновите пароль в БД или пересоздайте стек с чистыми volumes: `docker compose down -v`.
- **Не применяются изменения при `up --build`** — убедитесь, что Docker-кэш не выдаёт старый слой: используйте `docker compose build --no-cache` при сомнениях.
- **Загруженные изображения не видны** — убедитесь, что volume `uploads` смонтирован и приложение отдаёт `/uploads` с заголовком `Cache-Control`.
