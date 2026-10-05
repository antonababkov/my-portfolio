# План деплоя на Jino VPS (Docker + nginx, сборка контейнеров локально)

## 1. Краткое описание

Данный план описывает процесс упаковки и развёртывания проекта на Jino VPS с условием **обязательной локальной сборки Docker-образов**.

Текущая целевая конфигурация в `docker/docker-compose.yml` — `db + migrate + app` (PostgreSQL + Prisma migrate/seed + Next.js standalone). **nginx в Docker-стеке не используется** — он запускается **отдельно на хосте Jino VPS** (systemd), сертификаты Let's Encrypt выпускает certbot на хосте.

## 2. Варианты упаковки проекта

Есть два варианта отправки проекта на сервер. Рекомендуется **Вариант 2**.

| Критерий                            | Вариант 1. Только исходники (`.tar.gz`)                                                       | Вариант 2. Собранные образы + конфиги (рекомендуемый)                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Соответствует «сборка локально»** | Частично. При `docker compose up --build` возможна повторная сборка (зависит от кэша Docker). | **Да.** Образы собраны локально, на сервере выполняются только `docker load` и `up -d`. |
| **Объём архива**                    | Меньше (только исходный код).                                                                 | Чуть больше (Docker-образы в `.tar`).                                                   |
| **Скорость развёртывания**          | Средняя (возможна сборка на сервере).                                                         | **Быстрее** (только загрузка образов).                                                  |
| **Предсказуемость/идентичность**    | Возможны отличия окружения сборки.                                                            | **Максимально предсказуемо** (тот же образ, что был собран локально).                   |
| **Риск OOM на VPS (2 ГБ)**          | Есть риск, если вдруг пойдёт билд.                                                            | **Минимальный** (билдов на сервере нет).                                                |

**Рекомендация:** использовать **Вариант 2**.

## 3. Что упаковывать, а что исключать

### При упаковке исходников (Вариант 1)

**Исключить (не упаковывать):**

- `node_modules/` — установится при сборке
- `.next/` — генерируется при `next build`
- `.git/`, `.gitignore`
- `.env`, `.env.local`, `.env.*.local` — **секреты, ни в коем случае не отправлять в архиве**
- `*.tar`, `*.tar.gz` — старые архивы
- `uploads/` — том Docker (`uploads:/app/public/uploads`), пользовательские файлы должны храниться только на сервере
- `coverage/`, `.turbo/`, `.vscode/`, `.idea/`, `*.log` — временные/служебные файлы

**Обязательно упаковать:**

- `docker/` (включая `docker-compose.yml`, `docker/Dockerfile` и `docker/nginx/portfolio.conf`)
- `prisma/`
- `src/`, `public/`
- `package.json`, `package-lock.json`
- `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `components.json`
- `README.md` (опционально)

## 4. Вариант 2 (рекомендуемый) — Docker-образы + конфиги

### Шаг 1. Собрать Docker-образы локально

Выполняется из корня проекта `D:\JavaScript\my-portfolio\my-portfolio`.

```bash
docker compose --env-file .env -f docker/docker-compose.yml build
Данная команда выполнит сборку образов локально (включая multi-stage сборку Next.js). Билд Next.js происходит только локально, на сервере его не будет.
Шаг 2. Сохранить Docker-образы (только необходимые)
В текущем стеке используются db, migrate, app. postgres:16-alpine будет автоматически загружен с Docker Hub на сервере.
Рекомендуется сохранить только образ app:
docker save -o portfolio-app.tar $(docker compose --env-file .env -f docker/docker-compose.yml images -q app)
Опционально (для полной гарантии отсутствия повторной сборки migrate):
docker save -o portfolio-images.tar $(docker compose --env-file .env -f docker/docker-compose.yml images -q app migrate)
Шаг 3. Упаковать ТОЛЬКО конфиги
Создаём минимальный архив с конфигурационными файлами:
tar -czf portfolio-configs.tar.gz \
  docker/docker-compose.yml \
  docker/nginx/portfolio.conf
Важно: .env ни в коем случае не добавляем в архив. Файл .env создаётся вручную только на сервере.
Шаг 4. Отправить файлы на Jino VPS
С локальной машины (через scp):
# Конфиги
scp portfolio-configs.tar.gz user@<IP_JINO>:/home/<user>/

# Docker-образ(ы)
scp portfolio-app.tar user@<IP_JINO>:/home/<user>/
Шаг 5. Подготовить окружение на сервере
Подключаемся по SSH:
ssh user@<IP_JINO>
mkdir -p ~/portfolio
cd ~/portfolio
Распаковываем конфиги:
tar -xzf ~/portfolio-configs.tar.gz -C ~/portfolio
Создаём .env только на сервере:
nano .env  # Заполнить реальными значениями из .env.example
chmod 600 .env
Шаг 6. Загрузить Docker-образы на сервер
cd ~/portfolio
docker load -i ~/portfolio-app.tar
rm ~/portfolio-app.tar ~/portfolio-configs.tar.gz  # опционально для очистки
Шаг 7. Запустить стек
cd ~/portfolio
docker compose --env-file .env -f docker/docker-compose.yml up -d
Команда запустит только сервисы db, migrate, app. nginx не поднимается в этом Docker-стеке — он настраивается на хосте отдельно (раздел 6).
5. Вариант 1 — только исходники
Из корня проекта:
tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.env*' --exclude='*.tar' --exclude='*.tar.gz' --exclude='coverage' --exclude='.turbo' --exclude='.vscode' --exclude='.idea' --exclude='*.log' -czf portfolio-src.tar.gz .
Отправить архив на сервер, распаковать, затем на сервере выполнить:
cd ~/portfolio
docker compose --env-file .env -f docker/docker-compose.yml build
docker compose --env-file .env -f docker/docker-compose.yml up -d
Обратите внимание: этот вариант не соответствует требованию «сборка контейнеров локально», т.к. сборка образов частично/полностью может быть выполнена на сервере.
6. Настройка reverse-proxy на хосте (nginx + certbot)
В целевой конфигурации nginx запускается отдельно на хосте Jino VPS (не в Docker).

Причина разделения
Сервис app в docker-compose.yml проброшен на loopback-хоста:
ports:
  - "127.0.0.1:3000:3000"
Это означает, что Next.js доступен только по http://127.0.0.1:3000 на самом сервере, наружу во внешний интернет он не торчит. Reverse-proxy (nginx) принимает трафик на 80/443 и проксирует его на 127.0.0.1:3000.

Шаг 1. Установка пакетов
apt update && apt install -y nginx certbot

Шаг 2. Размещение конфига
Готовый конфиг лежит в репозитории — docker/nginx/portfolio.conf. В нём домен ababkov-ao.ru, при необходимости заменить на свой.
mkdir -p /var/www/certbot && chown www-data: /var/www/certbot
cp ~/portfolio/docker/nginx/portfolio.conf /etc/nginx/sites-available/portfolio.conf
ln -s /etc/nginx/sites-available/portfolio.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

Шаг 3. Выпуск сертификата (порядок важен)
nginx не стартует, пока в конфиге есть блок :443 и нет ssl-файлов. Поэтому сначала работает только :80:
- временно закомментировать server-блок «:443» в portfolio.conf
- nginx -t && systemctl reload nginx
- certbot certonly --webroot -w /var/www/certbot -d ababkov-ao.ru -d www.ababkov-ao.ru --agree-tos -m <EMAIL> --non-interactive
- вернуть блок :443, nginx -t && systemctl reload nginx
- systemctl enable --now certbot.timer (автопродление)

Домен рабочий — ababkov-ao.ru. Сертификат покрывает и www (SAN из двух имён), но www обслуживается только редиректом 301 на apex — и по HTTP, и по HTTPS. Отдельный server-блок :443 для www обязателен: без него запрос https://www.… не найдёт подходящего server_name, получит сертификат основного домена и упрётся в ошибку несовпадения имени вместо редиректа.

Ключевые директивы, которые нельзя потерять при правках
- proxy_set_header X-Forwarded-For $remote_addr — именно перезапись, а не $proxy_add_x_forwarded_for. getClientIp() (src/lib/rate-limit.ts) берёт первое значение XFF, поэтому с append клиент подменяет свой IP и обходит rate-limit логина.
- limit_req_zone $binary_remote_addr zone=auth_login:10m rate=5r/m + location = /api/auth/login — 5 запросов/мин на IP с burst=5 nodelay, отдаёт 429 до того, как запрос дойдёт до приложения. Считает и успешные попытки, поэтому значение держится на уровне LOGIN_MAX_ATTEMPTS (src/lib/rate-limit.ts). При отладке можно временно добавить limit_req_dry_run on.
- client_max_body_size 8m — дефолт nginx 1m обрезал бы загрузку фотографий (приложение само лимитит 5 МБ и вернуло бы JSON-ошибку 413).
- proxy_buffering off — Next.js 16 стримит SSR-ответы, буферизация на прокси ломает инкрементальный рендеринг.
- Security-заголовки (HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) не дублируются: их уже отдаёт next.config.ts. add_header в nginx добавляет заголовок, а не заменяет — дубль HSTS дал бы расхождение max-age с next.config.ts.
- server_tokens off — скрывает версию nginx (аналог -Server в Caddyfile).
- return 301 https://ababkov-ao.ru$request_uri с литералом домена, а не $host — $host берётся из заголовка Host и мог бы утечь в Location.

Проверка на сервере
nginx -t
curl -I http://ababkov-ao.ru              # 301 → https
curl -I https://ababkov-ao.ru            # 200, HSTS ровно один
curl -I http://www.ababkov-ao.ru         # 301 → https://ababkov-ao.ru
curl -I https://www.ababkov-ao.ru        # 301 → https://ababkov-ao.ru, без ошибки TLS
curl -s -o /dev/null -w '%{http_code}\n' https://ababkov-ao.ru/api/health   # 200
certbot renew --dry-run                  # проверка продления

Откат
nginx не участвует в Docker-стеке и не трогает volumes. Откат: rm /etc/nginx/sites-enabled/portfolio.conf && systemctl reload nginx.

7. Workflow обновления приложения
Поскольку сборка происходит локально (Вариант 2):
1. Внести изменения в код проекта (локально).
2. Пересобрать только образ app:
docker compose --env-file .env -f docker/docker-compose.yml build app
3. Сохранить новый образ с временной меткой (удобно для отката):
docker save -o portfolio-app-$(date +%Y%m%d-%H%M%S).tar $(docker compose --env-file .env -f docker/docker-compose.yml images -q app)
4. Отправить .tar-файл на сервер (scp).
5. На сервере загрузить образ: docker load -i portfolio-app-*.tar
6. Перезапустить только app (минимальное простоя):
cd ~/portfolio
docker compose --env-file .env -f docker/docker-compose.yml up -d app
7. Проверить логи: docker compose --env-file .env -f docker/docker-compose.yml logs -f app
8. Чек-лист готовности к первому деплою
- DNS настроен. A-записи на ababkov-ao.ru и www.ababkov-ao.ru указывают на публичный IP Jino VPS, пропагация завершена.
- Порты открыты. На Jino VPS порты 80 и 443 открыты для входящего трафика.
- .env создан на сервере. В ~/portfolio/.env заполнены все необходимые runtime-переменные, выставлены права chmod 600 .env.
- Docker + Docker Compose Plugin установлены на Jino VPS.
- Образы собраны локально (Шаг 1 Варианта 2) — без ошибок.
- Образы и конфиги перенесены на сервер (Шаг 4), образы загружены (docker load, Шаг 6).
- Docker-стек поднят. docker compose --env-file .env -f docker/docker-compose.yml up -d отработал успешно, все контейнеры в running.
- nginx + certbot установлены на хосте. docker/nginx/portfolio.conf размещён в sites-available/sites-enabled, `nginx -t` проходит.
- Сертификаты Let's Encrypt получены на ababkov-ao.ru и www.ababkov-ao.ru, certbot.timer включён, `certbot renew --dry-run` проходит.
- Проверка HTTPS. https://ababkov-ao.ru открывается, HTTP корректно редиректит на HTTPS, http://www.ababkov-ao.ru и https://www.ababkov-ao.ru редиректят на apex без ошибки TLS, API-роуты работают, X-Forwarded-For перезаписывается nginx (rate-limit логина не обходится подменой заголовка), nginx-овский limit_req на /api/auth/login отдаёт 429 при превышении.
- Автозапуск проверен. После перезагрузки сервера контейнеры автоматически поднимаются (restart: unless-stopped).
```
