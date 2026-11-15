# Статус плана подготовки к продакшену

Дата: 13.11.2026
Ветка: `develop`
Домен: `ababkov-ao.ru`

## Решения

- [x] Выполняем только P0+P1 из аудита.
- [x] Обновляем зависимости только security-патчами, без мажорных обновлений.
- [x] Соцсети пока остаются заглушками (`placeholder: true`), без редактирования из админки.
- [x] Seed создаёт только демо-профиль и админа; демо-проекты удаляются.
- [x] Access-логи nginx отключены.
- [x] Тесты/CI, UI смены пароля, редактирование соцсетей и Docker resource limits — вне текущей итерации.

## Сделано

### Зависимости и сборка

- [x] Обновлены `next`, `eslint-config-next`, `zod`, Prisma до security-версий.
- [x] Prisma Client сгенерирован, `prisma validate` и `prisma format` проходят.
- [x] Добавлен scoped override `@typescript-eslint/typescript-estree > minimatch@^11.0.8`.
- [x] `npm run lint` проходит.
- [x] `npx tsc --noEmit` проходит.
- [x] `npm run build` проходит на Next.js 16.4.6.
- [x] Сборка не требует доступной БД: при недоступной/неверной БД Prisma пишет `P1000`/`P1017`, а страницы используют fallback-значения.
- [x] `npm audit` и `npm audit --omit=dev`: 0 уязвимостей.
- [x] `prisma migrate deploy` успешно применяет все 8 миграций на временную PostgreSQL.
- [x] Seed проверен на идемпотентность: два запуска подряд без ошибок.
- [x] Каскад `Photo.project` проверен на реальной БД: после удаления проекта остаётся 0 фото.

### Docker и сборка образов

- [x] Dockerfile разделён на stage `prisma`: Prisma Client генерируется отдельно, без `next build`.
- [x] `builder` использует готовый клиент из stage `prisma`; `migrator` больше не зависит от `builder` и не запускает Next.js-сборку.
- [x] `openssl` установлен в stage `prisma` и `migrator`; предупреждение Prisma о libssl устранено.
- [x] `.dockerignore` исключает `src/generated`, чтобы не тащить устаревший локальный клиент в контекст сборки.
- [x] `docker compose --env-file .env -f docker/docker-compose.yml build` успешно собирает `docker-app` и `docker-migrate` (13.11.2026).
- [x] Проверено: в образе `docker-migrate` нет `.next`, Prisma CLI 7.10.1 и `tsx` работают, схема и сгенерированный клиент на месте.
- [x] README: все compose-команды переведены на `--env-file .env`, добавлена сборка обоих образов, обновлено описание stage.

### Инфраструктура и безопасность

- [x] `docker/nginx/portfolio.conf`: `access_log off`.
- [x] ACME-location добавлен и в HTTP-блок `www`.
- [x] `http2` переведён на совместимый `listen 443 ssl http2`.
- [x] Добавлены `Cross-Origin-Opener-Policy` и `Cross-Origin-Resource-Policy`.
- [x] Для API и admin выставляется `Cache-Control: no-store`.
- [x] Production-cookie админа переименована в `__Host-auth_token`.
- [x] `SITE_URL` в production работает fail-fast при отсутствии/некорректном значении.
- [x] Добавлены лимиты `sharp`: `limitInputPixels` и проверка выходного файла ≤5 МБ.

### 152-ФЗ, consent и Метрика

- [x] При отзыве согласия счётчик Метрики останавливается.
- [x] Cookie Метрики и `ym` удаляются, при активном счётчике выполняется reload.
- [x] Тексты политик обновлены под отключённые access-логи и cookie Метрики.
- [x] Заглушки соцсетей исключены из JSON-LD `sameAs`.
- [x] Fallback description переведён на `SITE_DESCRIPTION`.

### Фото и удаление данных

- [x] Добавлена миграция `20261112000000_photo_project_cascade`.
- [x] Удаление проекта удаляет фото из БД каскадом.
- [x] Файлы фото удаляются через общий `removeUploadedFile()`.
- [x] Удаление отдельного фото также очищает файл.
- [x] Раздача загруженных файлов идёт через `/api/uploads/[...file]`: в standalone статический `/uploads/...` видит только файлы, существовавшие на момент старта, а новые загрузки появляются уже во время работы.

### Документация и очистка

- [x] Обновлены `README.md`, `deploy-plan.md`, `.env.example`.
- [x] Добавлены в чек-лист бэкапы БД/uploads, UFW, SSH-ключи, fail2ban, unattended-upgrades.
- [x] Удалены `.bak`, неиспользуемые SVG и мусорные файлы.
- [x] `.env.example` содержит валидный локальный `DATABASE_URL` и production `SITE_URL`.

### Проверка приложения

- [x] Production standalone-сервер запущен на временной БД.
- [x] `/api/health` отвечает `{ ok: true }`.
- [x] Скрипт запуска проверяет `.env`, обязательные переменные, комментарии в значениях, занятый порт/PID и факт старта.
- [x] HTTP-smoke на standalone-сборке: 23/23 проверок (13.11.2026).
- [x] Скрипты проверки: `%TEMP%\opencode\start-audit-server.ps1` и `%TEMP%\opencode\smoke-audit.ps1` (вне репозитория).
- [x] Проверены security-заголовки, CSP с nonce, HSTS, COOP/CORP, `X-Robots-Tag`, отсутствие `X-Powered-By`.
- [x] Проверены `robots.txt`, `sitemap.xml`, OG-изображение и JSON-LD с живой БД.
- [x] Проверены login-cookie (`__Host-auth_token`, `HttpOnly`, `Secure`, `SameSite=lax`, `Path=/`), `/api/auth/me`, redirect и доступ к `/admin`.
- [x] Проверены CSRF-отказы для logout и создания проекта.
- [x] Проверены создание проекта, загрузка/раздача изображения, привязка и удаление фото.
- [x] Проверены лимит 5 МБ (413), decompression-bomb (400), каскадное удаление проекта и файлов, отдельное удаление фото с файлом.
- [x] Проверены rate-limit логина (5×401, затем 429) и очистка cookie при logout (`Max-Age=0`).
- [x] JSON-LD `image` переведён на фактический URL раздачи `/api/uploads/...` (статический `/uploads/...` не подхватывает файлы, загруженные после старта standalone-сервера).
- [x] В браузере проверены consent-баннер (accept/decline/reload), отзыв согласия, удаление cookie Метрики, мобильный вид и тексты политик (13.11.2026).

## В работе

- [ ] Остановка временного standalone-сервера и временной PostgreSQL после браузерных проверок.

## История: зависание 12.11.2026 и решение

Процесс, запущенный командой:

```powershell
$envMap = @{}; Get-Content -LiteralPath ".env" | ForEach-Object { if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $envMap[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'") } }; $user = [uri]::EscapeDataString($envMap['POSTGRES_USER']); $pass = [uri]::EscapeDataString($envMap['POSTGRES_PASSWORD']); $db = [uri]::EscapeDataString($envMap['POSTGRES_DB']); $dbUrl = "postgresql://${user}:${pass}@localhost:55432/${db}"; & "$env:TEMP\opencode\start-audit-server.ps1" -ProjectRoot (Get-Location).Path -Port 3001 -DatabaseUrl $dbUrl -StopPrevious
```

отдал `Server ready: pid=13888, port=3001, health=ok`, но инструмент ждал процесс-потомок часами.

Решение от 13.11.2026:

- Сервер запускается через WMI `Win32_Process Create`, поэтому процесс не является потомком PowerShell и команда сразу возвращает управление.
- В `start-audit-server.ps1` добавлены `-DbPort`, проверка health с таймаутом и безопасная остановка по PID/порту.
- В `smoke-audit.ps1` добавлены глобальный таймаут и `--max-time`/`--connect-timeout` для каждого curl-запроса.
- JSON-тела запросов передаются через файл (`--data-binary @file`), чтобы обойти искажение кавычек в PowerShell 5.1.
- Проверки файлов uploads учитывают, что standalone-сервер работает с каталогом `.next/standalone/public/uploads`.


## Осталось сделать

### До деплоя (локально)

- [ ] Остановить временный standalone-сервер (порт `3001`) и временную PostgreSQL `portfolio-audit-db` (порт `55432`); убедиться, что порт `3001` свободен.
- [ ] Создать production `.env` отдельно от локального: не копировать текущий `.env`. Файл называется именно `.env`; `.env.production` в текущей Docker-схеме не нужен.
- [ ] Задать в production `.env` новые секреты: `POSTGRES_PASSWORD` (URL-safe), `AUTH_SECRET` (≥32 символов), `AUTH_ADMIN_PASSWORD` (≥8 символов, не плейсхолдер), `SITE_URL=https://ababkov-ao.ru`, production `NEXT_PUBLIC_METRIKA_ID`.
- [ ] Зафиксировать финальный пароль администратора **до первого production seed**: seed не перезаписывает существующий пароль при cost ≥ 12.
- [ ] Проверить, что локальные build-args совпадают с production: `SITE_URL` и `NEXT_PUBLIC_METRIKA_ID` вшиваются в `docker-app` на этапе сборки; после изменения нужна пересборка.
- [ ] Пересобрать оба образа после всех правок: `docker compose --env-file .env -f docker/docker-compose.yml build`.
- [ ] Проверить состав образов: `docker compose --env-file .env -f docker/docker-compose.yml config --images`; в `docker-migrate` не должно быть `.next`; `.env` не должен попадать в образ или архив.
- [ ] Сохранить образы: `docker save -o portfolio-images-YYYYMMDD-HHMMSS.tar docker-app:latest docker-migrate:latest`; отдельно упаковать `docker/docker-compose.yml` и `docker/nginx/portfolio.conf`.
- [ ] Проверить git-состояние: миграция `20261112000000_photo_project_cascade` и `PLAN-STATUS.md` должны попасть в коммит; выполнить `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`; сделать commit/tag.
- [ ] Решить судьбу заглушек соцсетей. По текущему решению они остаются (`placeholder: true`) и в текущую итерацию не входят; если заменяем — сделать до сборки образов.
- [ ] Подготовить место и retention для бэкапов (например, `/var/backups/portfolio`, 7–14 дней) до открытия сайта.
- [ ] Опционально: устранить предупреждение Turbopack о динамическом `path.join` в `src/app/api/upload/route.ts:209`; на деплой не влияет, но раздувает трассировку standalone-сборки.

### Во время деплоя (VPS, до публичного открытия)

- [ ] DNS: A-записи `ababkov-ao.ru` и `www.ababkov-ao.ru` → IP VPS; дождаться распространения.
- [ ] Базовая безопасность: SSH по ключам, отключить вход по паролю, UFW только `22/80/443`, fail2ban для SSH, `unattended-upgrades`, корректный часовой пояс.
- [ ] Установить Docker Engine + Compose plugin; проверить `docker version` и `docker compose version`.
- [ ] Создать `~/portfolio`, загрузить `docker-compose.yml`, `docker/nginx/portfolio.conf` и production `.env`; выполнить `chmod 600 .env`. Локальный `.env` не передавать.
- [ ] Загрузить образы: `docker load -i portfolio-images-*.tar`; сверить `docker compose --env-file .env -f docker/docker-compose.yml config --images`.
- [ ] Запустить стек: `docker compose --env-file .env -f docker/docker-compose.yml up -d --no-build`; проверить `ps` (`db` и `app` — `Up (healthy)`) и `logs migrate` (`Seed completed`).
- [ ] Установить nginx; сначала включить конфиг только на `:80`; выполнить `nginx -t`; выпустить сертификаты certbot для apex и `www`; включить финальный `:443`; снова `nginx -t`; выполнить reload.
- [ ] Проверить `certbot renew --dry-run`, активность `certbot.timer`, редиректы HTTP→HTTPS и `www`→apex.
- [ ] Убедиться, что приложение доступно только через nginx: `127.0.0.1:3000` не открыт наружу, снаружи доступны только `80/443`.

### После деплоя

- [ ] E2E через HTTPS: `/api/health`, login/logout, `/admin`, создание/редактирование проекта, загрузка и раздача фото, каскадное удаление проекта и файлов, лимит 5 МБ, `429` на login с корректным `X-Forwarded-For`.
- [ ] Проверить security-заголовки: CSP с nonce, HSTS ровно один, COOP/CORP, `X-Robots-Tag`, отсутствие `X-Powered-By`, `Cache-Control: no-store` на API и admin.
- [ ] Проверить `robots.txt`, `sitemap.xml`, OG-изображение, JSON-LD и раздачу `/api/uploads/...` на production-домене.
- [ ] Повторно проверить consent-баннер и Метрику на production: accept/decline, reload, удаление cookie, мобильный вид.
- [ ] Настроить регулярный `pg_dump` и архивирование volume `uploads`; проверить восстановление БД и файлов на копии.
- [ ] Проверить автозапуск после reboot: контейнеры (`restart: unless-stopped`), nginx, `certbot.timer`.
- [ ] Проверить свободное место и логи Docker, настроить ротацию; при необходимости добавить внешний мониторинг.
- [ ] Заменить заглушки соцсетей при отдельном решении; это потребует пересборки `docker-app` и повторного деплоя.

## Следующий шаг

1. Остановить временный standalone-сервер и `portfolio-audit-db`.
2. Подготовить production `.env` с новыми секретами и финальным паролем администратора.
3. Пересобрать и сохранить `docker-app` / `docker-migrate`; проверить build-args и отсутствие `.env` в артефактах.
4. Зафиксировать изменения в git, включая миграцию каскада и `PLAN-STATUS.md`.
5. На VPS: DNS, SSH/UFW/fail2ban/unattended-upgrades, Docker, `.env`, `docker load`, `up -d --no-build`.
6. nginx + certbot: `nginx -t`, выпуск сертификатов, `certbot renew --dry-run`.
7. E2E через HTTPS, бэкапы и восстановление, тест автозапуска после reboot.
