# План: Личный сайт-портфолио

## 1. Инициализация проекта

| Шаг | Описание                                                         |
| --- | ---------------------------------------------------------------- |
| 1.1 | `npx create-next-app@latest` с TypeScript, App Router, SASS      |
| 1.2 | Установить зависимости: `postcss`, `autoprefixer`, `terser`      |
| 1.3 | Настроить `tsconfig.json`, `next.config.js` (оптимизация сборки, `output: 'standalone'`) |
| 1.4 | Настроить `postcss.config.js` — используем чистый SASS           |

---

## 2. Решения (подтверждено)

| #   | Вопрос                    | Решение                                             |
| --- | ------------------------- | --------------------------------------------------- |
| 1   | **Vite vs Next.js**       | **Next.js** — SEO из коробки, SSR                   |
| 2   | **Хранение данных**       | **PostgreSQL + Prisma** — надёжная, масштабируемая СУБД |
| 3   | **Авторизация**           | **jsonwebtoken** (httpOnly cookie), bcrypt для пароля |
| 4   | **Загрузка файлов**       | **Локально** в `public/uploads/`                    |
| 5   | **Дизайн**                | Подбираем сами. Поддержка **тёмной и светлой тем**   |
| 6   | **Деплой**                | **Docker на VPS** (PostgreSQL в контейнере + локальные файлы) |

---

## 3. Структура проекта

```
├── docker/
│   ├── Dockerfile             # Multi-stage сборка
│   ├── docker-compose.yml     # Приложение + БД Postgres + uploads
│   └── .dockerignore
│
├── data/
│   └── (пустой каталог для хранения volumes БД и uploads)
│
└── src/
    ├── app/
    │   ├── layout.tsx              # Корневой layout (SEO meta, шрифты, data-theme)
    │   ├── page.tsx                # Главная страница
    │   ├── admin/
    │   │   ├── page.tsx            # Админ-панель (логин + редактирование)
    │   │   └── layout.tsx          # Layout админки (защищённый маршрут)
    │   ├── api/
    │   │   ├── auth/route.ts       # Авторизация (jsonwebtoken)
    │   │   ├── profile/route.ts    # CRUD профиля
    │   │   ├── projects/route.ts   # CRUD проектов
    │   │   └── upload/route.ts     # Загрузка изображений
    │   └── globals.scss            # Глобальные стили, переменные, миксины
    │
    ├── components/
    │   ├── home/
    │   │   ├── AboutSection.tsx    # Блок «О пользователе»
    │   │   ├── PhotoSlider.tsx     # Слайдер фото
    │   │   ├── ProjectsSection.tsx # Блок «Проекты»
    │   │   └── ProjectCard.tsx     # Карточка одного проекта
    │   ├── footer/
    │   │   └── Footer.tsx          # Футер
    │   ├── ui/
    │   │   ├── ThemeToggle.tsx     # Переключатель тёмной/светлой темы
    │   │   ├── Slider.tsx          # Универсальный слайдер
    │   │   ├── Button.tsx
    │   │   ├── Modal.tsx
    │   │   └── Loader.tsx
    │   └── admin/
    │       ├── AdminDashboard.tsx  # Главный экран админки
    │       ├── EditAbout.tsx       # Редактирование блока «О себе»
    │       ├── EditProjects.tsx    # Редактирование проектов
    │       ├── ImageUploader.tsx   # Компонент загрузки фото
    │       └── Login.tsx           # Форма входа
    │
    ├── lib/
    │   ├── db.ts                   # Подключение к PostgreSQL через Prisma
    │   ├── auth.ts                 # Логика авторизации (JWT)
    │   ├── theme.ts                # Чтение/запись выбранной темы
    │   └── constants.ts            # Константы, дефолтные данные
    │
    ├── types/
    │   └── index.ts                # TypeScript-интерфейсы
    │
    └── styles/
        ├── _variables.scss         # Цвета темы, шрифты, брейкпоинты
        ├── _mixins.scss            # Адаптивные миксины
        ├── _animations.scss        # Анимации слайдеров
        └── _themes.scss            # CSS-переменные для light/dark
```

---

## 4. Данные и хранение

**Решение:** PostgreSQL + Prisma. База данных разворачивается отдельным контейнером (`postgres:16`).

- Подключение через `DATABASE_URL=postgresql://user:password@db:5432/portfolio`
- Данные на **managed volume** Docker — переживают пересборку контейнера и обновление образа
- `npx prisma migrate deploy` применяет миграции при старте приложения

---

## 5. Схема данных (Prisma)

```prisma
model Profile {
  id          String   @id @default(cuid())
  fullName    String
  position    String
  description String
  photos      Photo[]
}

model Photo {
  id        String   @id @default(cuid())
  url       String
  alt       String
  profile   Profile? @relation(fields: [profileId], references: [id])
  profileId String?
  project   Project? @relation(fields: [projectId], references: [id])
  projectId String?
  order     Int
}

model Project {
  id          String  @id @default(cuid())
  title       String
  description String
  photos      Photo[]
  link        String?
  order       Int
}

model Admin {
  id       String @id @default(cuid())
  login    String @unique
  password String
}
```

---

## 6. Главная страница — компоненты

### 6.1. Блок «О пользователе» (AboutSection)

- **PhotoSlider** — карусель с автопроигрыванием
  - Навигация: точки + стрелки
  - Свайп на мобильных (touch events)
  - Lazy loading изображений (`next/image`)
- **ФИО** — заголовок `<h1>`
- **Должность** — подзаголовок `<h2>`
- **Описание** — `<p>`, 4-5 строк

### 6.2. Блок «Проекты» (ProjectsSection)

- Каждый проект — отдельная `<section>` с:
  - Слайдером фото проекта
  - Названием `<h3>`
  - Описанием
  - Ссылкой на проект (опционально)
- Пагинация или вертикальный скролл

### 6.3. Footer

- Контакты (email, телефон)
- Ссылки на соц. сети (иконки)
- Ссылки на политику конфиденциальности и правила обработки ПДн
- Модальное окно с текстом политики

---

## 7. Админ-панель

### 7.1. Авторизация

- Страница `/admin` — редирект на `/admin/login` если не авторизован
- Логин/пароль → JWT-токен в httpOnly cookie (jsonwebtoken, bcrypt-хэш)

### 7.2. Редактирование «О пользователе»

- Форма: ФИО, должность, описание (textarea)
- Управление фото-слайдером: загрузка, удаление, изменение порядка (drag & drop)
- Превью в реальном времени

### 7.3. Редактирование проектов

- Список проектов с кнопками: Редактировать / Удалить / Добавить новый
- Форма проекта: название, описание, ссылка, фото (загрузка + drag & drop)
- Подтверждение удаления (модалка)

### 7.4. Загрузка изображений

- API-роут `/api/upload` — сохраняет в `public/uploads/`
- Валидация: тип файла (jpg, png, webp), максимальный размер
- Конвертация/резайз через `sharp` (опционально)

---

## 8. Дизайн и темы

**Решение:** подбираем минималистичный стиль, поддерживаем **тёмную и светлую темы**.

- Цвета задаются **CSS-переменными** в `_themes.scss` (два набора: `light`, `dark`)
- Атрибут `data-theme="light|dark"` на `<html>`
- Дефолт по `prefers-color-scheme`, выбор пользователя сохраняется (localStorage/cookie)
- Переключатель `ThemeToggle` в шапке/футере
- SASS-переменные (`_variables.scss`) — только для шрифтов, брейкпоинтов, зазоров; цвета — через CSS-переменные

---

## 9. SEO

| Элемент              | Реализация                                                 |
| -------------------- | ---------------------------------------------------------- |
| `<title>`            | Динамический из `metadata` в `layout.tsx`                  |
| `<meta description>` | Из данных профиля                                          |
| Open Graph           | `opengraph-image`, `og:title`, `og:description`            |
| Canonical URL        | `metadata.alternates.canonical`                            |
| Sitemap              | `app/sitemap.ts`                                           |
| Robots.txt           | `app/robots.ts`                                            |
| Structured Data      | JSON-LD (Person schema)                                    |
| `next/image`         | Автоматический `alt`, `srcset`, WebP                       |
| Semantic HTML        | `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` |

---

## 10. Адаптивный дизайн

| Брейкпоинт | Ширина | Описание     |
| ---------- | ------ | ------------ |
| Mobile S   | 320px  | Базовый      |
| Mobile M   | 375px  | iPhone SE    |
| Mobile L   | 425px  | iPhone 12/13 |
| Tablet     | 768px  | iPad         |
| Laptop     | 1024px | Ноутбук      |
| Desktop    | 1440px | Десктоп      |

**Подход:** SASS-миксины + CSS Grid/Flexbox. Mobile-first.

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == "tablet" {
    @media (min-width: 768px) {
      @content;
    }
  }
  @if $breakpoint == "laptop" {
    @media (min-width: 1024px) {
      @content;
    }
  }
  @if $breakpoint == "desktop" {
    @media (min-width: 1440px) {
      @content;
    }
  }
}
```

**Кроссбраузерность:** Autoprefixer покрывает 99%+ браузеров.

- Тестирование: Chrome, Firefox, Safari, Edge (в обеих темах)

---

## 11. Безопасность

- Пароль — bcrypt-хеш
- JWT в httpOnly cookie (jsonwebtoken)
- Валидация входных данных (zod)
- Rate limiting на API-роуты
- Защита от CSRF
- Content-Security-Policy заголовки
- `AUTH_SECRET` — только через переменные окружения (секреты не в коде и не в Dockerfile)

---

## 12. Docker и деплой (VPS)

**Зачем Docker здесь:** проект использует PostgreSQL и локальные загрузки в `public/uploads/` — на безсерверные платформы (Vercel/Netlify) его выложить сложнее, нужен Node-хост. Docker даёт воспроизводимый деплой на VPS: фиксированная версия Node, база данных в контейнере, нативные зависимости (sharp, bcrypt, Prisma engines) уже внутри образа, лёгкий перезапуск и откат.

### 12.1. Dockerfile (multi-stage)

```dockerfile
# 1. Зависимости
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Сборка
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# 3. Runtime (standalone)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN useradd -m nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --chown=nextjs:nextjs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

Важно:
- Базовый образ **`node:20-slim`**, не `alpine` — нативные модули (sharp, bcrypt, Prisma) легко ломаются на alpine/musl
- `npx prisma generate` — на этапе сборки
- `npx prisma migrate deploy` — при старте контейнера (применение миграций БД)

### 12.2. docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db-data:/var/lib/postgresql/data   # данные БД — на volume
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dockerignore  # путь уточнить
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      AUTH_SECRET: ${AUTH_SECRET}
    volumes:
      - uploads:/app/public/uploads   # загруженные изображения

volumes:
  db-data:
  uploads:
```

Замечания:
- **Postgres** развёрнут отдельным контейнером, его данные — на **volume** `db-data` (переживают пересборку)
- Загруженные картинки — на **volume** `uploads`
- Приложение стартует только после готовности БД (`healthcheck` + `depends_on`)
- Порт наружу слушает только localhost — наружу его отдаёт обратный прокси
- Секреты (`POSTGRES_*`, `AUTH_SECRET`) берутся из `.env` на хосте, не пишутся в compose-файл

### 12.3. Обратный прокси + HTTPS

  - **Caddy** (рекомендуется): автоматический HTTPS, минимальная конфигурация
  - `Caddyfile`: `domain.ru { reverse_proxy app:3000 }`
- Или Traefik / Nginx + Let's Encrypt

### 12.4. .dockerignore

```
node_modules
.next
data
public/uploads
.git
.env*
npm-debug.log
```
---

## 13. Порядок реализации (этапы)

| #   | Этап                         | Описание                                             |
| --- | ---------------------------- | ---------------------------------------------------- |
| 1   | **Инициализация**            | Next.js + TypeScript + SASS + Prisma + PostgreSQL | ✅ Выполнен (01.09.2026) |
| 2   | **Дизайн-система**           | Переменные тем (light/dark), миксины, UI-компоненты  | ✅ Выполнен (01.09.2026) |
| 3   | **Темы**                     | ThemeToggle, data-theme, prefers-color-scheme        | ✅ Выполнен (01.09.2026) |
| 4   | **API + БД**                 | Prisma-схема, API-роуты (profile, projects, upload), миграции |
| 5   | **Главная — «О себе»**       | AboutSection + PhotoSlider                           |
| 6   | **Главная — «Проекты»**      | ProjectsSection + ProjectCard + слайдеры             |
| 7   | **Footer**                   | Контакты, соцсети, политика                          |
| 8   | **SEO**                      | Meta-теги, OG, sitemap, robots, JSON-LD              |
| 9   | **Админка — Авторизация**    | Логин, JWT, middleware                               |
| 10  | **Админка — Редактирование** | Формы редактирования всего контента                  |
| 11  | **Адаптивность**             | Тестирование под все брейкпоинты (в обеих темах)     |
| 12  | **Оптимизация**              | Terser, lazy loading, image optimization             |
| 13  | **Тестирование**             | Кроссбраузерность, Lighthouse, a11y                  |
| 14  | **Docker и деплой**          | Dockerfile, compose (app + Postgres), volumes, HTTPS на VPS |

---

## 14. Открытый вопрос

1. **Конкретный стиль**: макета нет, подбираем сами. Зафиксированы тёмная и светлая темы и минималистичный подход, но детали (акцентный цвет, шрифт, отступы) — определим на этапе дизайн-системы.

> **Решено на этапе 2 (01.09.2026):** минималистичный стиль. Акцентный цвет — индиго: `#4f46e5` (light) / `#818cf8` (dark). Шрифты — Geist/Geist Mono (next/font). Все цвета — через CSS-переменные (`_themes.scss`), SASS-переменные — только шрифты/брейкпоинты/отступы. UI-компоненты: Button, Modal, Loader, Slider.