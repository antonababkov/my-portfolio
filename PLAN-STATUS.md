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

## В работе

- [ ] Проверка consent/Метрики и consent-баннера в браузере (accept/decline/reload, удаление cookie, мобильный вид).
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


## Не сделано

### Функциональный smoke

- [ ] Проверить accept/decline consent и reload при отзыве.
- [ ] Проверить удаление cookie Метрики.
- [x] Проверить login: `__Host-auth_token`, `HttpOnly`, `Secure`, `SameSite`.
- [x] Проверить redirect неавторизованного пользователя с `/admin`.
- [x] Проверить `Cache-Control: no-store` на API и admin.
- [x] Проверить COOP/CORP, CSP и остальные security-заголовки.
- [x] Проверить загрузку изображения, лимит 5 МБ и отказ для decompression-bomb.
- [x] Проверить удаление проекта вместе с записями фото и файлами в `uploads`.
- [x] Проверить `robots.txt`, `sitemap.xml`, OG-изображение и metadata с живой БД.
- [ ] Проверить тексты политик и работу consent-баннера на мобильном.

### Инфраструктура

- [ ] `nginx -t` на целевом конфиге.
- [ ] Certbot dry-run для apex и `www`.
- [ ] E2E-проверка через nginx и HTTPS.
- [ ] Настроить UFW: только 22/80/443.
- [ ] Настроить SSH по ключам и fail2ban для SSH.
- [ ] Включить `unattended-upgrades`.
- [ ] Настроить регулярные `pg_dump` и архивирование `uploads`.
- [ ] Проверить восстановление БД/uploads на копии.

### Деплой

- [ ] Собрать и запустить production на VPS.
- [ ] Применить миграции на production-БД.
- [ ] Выполнить production seed.
- [ ] Задать реальный пароль администратора.
- [ ] Заменить заглушки соцсетей на реальные ссылки.
- [ ] Проверить `SITE_URL` и `NEXT_PUBLIC_METRIKA_ID` в production.
- [ ] Проверить автозапуск контейнеров и nginx после перезагрузки.

## Следующий шаг

1. Проверить в браузере consent-баннер, отзыв согласия, удаление cookie Метрики и мобильный вид.
2. Остановить временный standalone-сервер и временную PostgreSQL.
3. Проверить `nginx -t`, certbot dry-run и E2E через nginx.
4. Перейти к деплою и инфраструктурному чек-листу.
