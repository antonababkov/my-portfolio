# План деплоя на Jino VPS (Docker + nginx)

## 1. Что где работает

| Слой                              | Где      | Как запускается                                            |
| --------------------------------- | -------- | ---------------------------------------------------------- |
| `db` (PostgreSQL 16)              | Docker   | compose-сервис, порты наружу не пробрасываются             |
| `migrate` (Prisma migrate + seed) | Docker   | одноразовый compose-сервис, `restart: "no"`                |
| `app` (Next.js standalone)        | Docker   | compose-сервис на `127.0.0.1:3000` — наружу не торчит      |
| nginx + certbot                   | Хост VPS | systemd; принимает 80/443 и проксирует на `127.0.0.1:3000` |

```
Интернет ──▶ nginx :80/:443 ──▶ 127.0.0.1:3000 ──▶ app (Next.js standalone)
             (TLS Let's Encrypt)                     │
                                                     └──▶ db (PostgreSQL)
```

nginx в `docker/docker-compose.yml` **не участвует** — он ставится и настраивается на хосте отдельно (раздел 6). Разделение нужно потому, что `app` опубликован только на loopback:

```yaml
# docker/docker-compose.yml
ports:
  - "127.0.0.1:3000:3000"
```

Разница между вариантами доставки — только в том, **что именно отправляется на сервер** (собранные образы или исходники). Шаги 6 (nginx), 7 (обновление) и 8 (чек-лист) одинаковы для обоих.

---

## 2. Предварительные требования (общие для обоих вариантов)

| Требование                                        | Как проверить                                 |
| ------------------------------------------------- | --------------------------------------------- |
| Ubuntu/Debian с systemd                           | `systemctl --version`                         |
| Docker Engine + Compose plugin                    | `docker version && docker compose version`    |
| SSH-доступ и `scp` с локальной машины             | `ssh user@<IP_JINO>`                          |
| A-записи на `ababkov-ao.ru` и `www.ababkov-ao.ru` | `nslookup ababkov-ao.ru` → совпадает с IP VPS |
| Порты 80 и 443 открыты                            | `ufw status` / панель Jino                    |
| nginx + certbot                                   | `apt update && apt install -y nginx certbot`  |
| Каталог `~/portfolio` и `.env` в нём              | `chmod 600 ~/portfolio/.env`                  |

> **Имя compose-проекта** берётся из имени каталога с compose-файлом, то есть из `docker` → образы называются `docker-app` и `docker-migrate`, контейнеры — `docker-app-1`. Если каталог переименовать, Compose начнёт ожидать другие теги образов, и `docker load` перестанет их находить. Проверить ожидаемые имена: `docker compose --env-file .env -f docker/docker-compose.yml config --images`.

`.env` **никогда не переносится в архиве** — на сервере он создаётся вручную из `.env.example`, права `chmod 600`.

---

## 3. Выбор варианта доставки

| Критерий                            | Вариант 1. Только исходники (`.tar.gz`)           | Вариант 2. Готовые образы + конфиги (рекомендуемый)      |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| **Соответствует «сборка локально»** | Частично: `docker compose build` уходит на сервер | **Да:** сборка только локально, на сервере `load` + `up` |
| **Объём переноса**                  | Меньше (только исходный код)                      | Больше (Docker-образы в `.tar`)                          |
| **Скорость развёртывания**          | Средняя (сборка на сервере)                       | **Быстрее** (только загрузка образов)                    |
| **Предсказуемость**                 | Может отличаться от локальной (окружение сборки)  | **Максимальная** (тот же образ, что собран локально)     |
| **Риск OOM на VPS (2 ГБ)**          | Есть: сборка `sharp`/`pg`/`next build` на сервере | **Нет** (сборки на сервере не бывает)                    |
| **Сложность**                       | Проще (один архив)                                | Два файла: архив конфигов + образы                       |

**Рекомендация: Вариант 2** — раздел 4. Требование «сборка контейнеров локально» выполняется в нём полностью, Вариант 1 (раздел 5) нарушает его по построению.

---

## 4. Вариант 2 — готовые образы + конфиги (рекомендуемый)

### 4.1. Локально (Windows)

Все команды выполняются из корня проекта в Git Bash / WSL.

#### Шаг 1. Собрать образы

```bash
docker compose --env-file .env -f docker/docker-compose.yml build
```

Собираются **оба** образа с `build:` — `docker-app` (target `runner`) и `docker-migrate` (target `migrator`). Тяжёлая multi-stage сборка Next.js целиком происходит локально.

#### Шаг 2. Сохранить образы

```bash
docker save -o portfolio-images.tar \
  $(docker compose --env-file .env -f docker/docker-compose.yml images -q app) \
  $(docker compose --env-file .env -f docker/docker-compose.yml images -q migrate)
```

> **Оба образа обязательны.** У сервиса `migrate` в compose есть секция `build:`, поэтому без его образа `docker compose up` на сервере попытается собрать его заново — и требование «сборка локально» будет нарушено. `postgres:16-alpine` сохранять не нужно: на сервере он скачается из Docker Hub сам.

#### Шаг 3. Упаковать конфиги

```bash
tar -czf portfolio-configs.tar.gz \
  docker/docker-compose.yml \
  docker/Dockerfile \
  docker/nginx/portfolio.conf \
  .env.example
```

> `.env.example` кладём в архив безопасно — в нём только плейсхолдеры. Реальный `.env` не переносится никогда.

#### Шаг 4. Отправить на сервер

```bash
scp portfolio-configs.tar.gz user@<IP_JINO>:/home/<user>/
scp portfolio-images.tar     user@<IP_JINO>:/home/<user>/
```

### 4.2. На сервере

#### Шаг 5. Распаковать конфиги, создать `.env`

```bash
ssh user@<IP_JINO>
mkdir -p ~/portfolio
tar -xzf ~/portfolio-configs.tar.gz -C ~/portfolio
```

Создать `.env` на основе шаблона из архива (сам `.env` в архиве нет):

```bash
cd ~/portfolio
cp .env.example .env
nano .env              # POSTGRES_*, DATABASE_URL, AUTH_*, SITE_URL=https://ababkov-ao.ru
chmod 600 .env
```

#### Шаг 6. Загрузить образы

```bash
cd ~/portfolio
docker load -i ~/portfolio-images.tar
docker compose --env-file .env -f docker/docker-compose.yml config --images   # сверить теги
```

#### Шаг 7. Запустить стек

```bash
cd ~/portfolio
docker compose --env-file .env -f docker/docker-compose.yml up -d --no-build
docker compose -f docker/docker-compose.yml ps          # db и app — Up (healthy)
docker compose -f docker/docker-compose.yml logs migrate # «Seed completed: …»
```

Флаг `--no-build` — страховка: если образ почему-то не найден, compose упадёт с ошибкой, а не начнёт молча собирать на сервере.

Поднимутся только `db`, `migrate`, `app`. nginx настраивается отдельно — раздел 6.

---

## 5. Вариант 1 — только исходники

Используйте, если доставлять образы неудобно (например, ограничение на размер файла при `scp`). **Нарушает требование «сборка локально»**: `docker compose build` выполняется на сервере.

### 5.1. Что исключить из архива

**Не упаковывать:**

- `node_modules/` — установится при сборке
- `.next/`, `tsconfig.tsbuildinfo` — генерируются при `next build`
- `.git/`, `.gitignore`
- `.env`, `.env.local`, `.env.*.local` — **секреты** (`.env.example` положить можно)
- `*.tar`, `*.tar.gz` — старые архивы
- `public/uploads/` — том Docker (`uploads:/app/public/uploads`), пользовательские файлы хранятся только на сервере
- `coverage/`, `.turbo/`, `.vscode/`, `.idea/`, `*.log`

**Обязательно упаковать:**

- `docker/` — `docker-compose.yml`, `Dockerfile`, `nginx/portfolio.conf`
- `prisma/` (включая `migrations/`, `seed.ts`, `schema.prisma`), `prisma7.config.ts`
- `src/`, `public/` (без `uploads/`)
- `package.json`, `package-lock.json` — lock-файл обязателен, `npm ci` иначе не отработает
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `.dockerignore`, `.env.example`

### 5.2. Локально: собрать архив из корня проекта и отправить

```bash

tar \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./tsconfig.tsbuildinfo' \
  --exclude='./.git' \
  --exclude='./.gitignore' \
  --exclude='./.env' \
  --exclude='./.env.local' \
  --exclude='./.env.*.local' \
  --exclude='./public/uploads' \
  --exclude='./coverage' \
  --exclude='./.turbo' \
  --exclude='./.vscode' \
  --exclude='./.idea' \
  --exclude='*.log' \
  --exclude='*.tar' \
  --exclude='*.tar.gz' \
  -czf portfolio-src.tar.gz .

scp portfolio-src.tar.gz user@<IP_JINO>:/home/<user>/
```

### 5.3. На сервере: собрать и запустить

```bash
ssh user@<IP_JINO>
mkdir -p ~/portfolio
tar -xzf ~/portfolio-src.tar.gz -C ~/portfolio
cd ~/portfolio
chmod 600 .env

docker compose --env-file .env -f docker/docker-compose.yml build
docker compose --env-file .env -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs migrate
```

> **Риск на VPS с 2 ГБ RAM:** сборка `sharp` и `pg` требует временной памяти под `npm ci` и `next build`. Если сборка падает с OOM — добавьте своп:
>
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

### 5.4. Чем дальнейшая работа отличается от Варианта 2

Только шагом доставки: вместо `docker save` → `scp` → `docker load` вы отправляете изменённые исходники и запускаете `docker compose build` на сервере. Шаги 6, 7, 8 идентичны.

---

## 6. nginx + certbot на хосте VPS (общий шаг для обоих вариантов)

Выполняется после того, как Docker-стек отвечает на `http://127.0.0.1:3000`.

### Шаг 1. Установка пакетов

```bash
apt update && apt install -y nginx certbot
```

### Шаг 2. Размещение конфига

Готовый конфиг — `docker/nginx/portfolio.conf`. Домен в нём `ababkov-ao.ru`; при необходимости заменить на свой в трёх местах: `server_name` в трёх `server`-блоках и путь к сертификату.

```bash
mkdir -p /var/www/certbot && chown www-data: /var/www/certbot
cp ~/portfolio/docker/nginx/portfolio.conf /etc/nginx/sites-available/portfolio.conf
ln -s /etc/nginx/sites-available/portfolio.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### Шаг 3. Выпуск сертификата (порядок важен)

nginx не запустится, пока в конфиге есть блоки `:443`, а ssl-файлов ещё нет. Поэтому сначала работает только `:80`:

```bash
# 1) временно закомментировать ОБА server-блока :443 в portfolio.conf
nginx -t && systemctl reload nginx

# 2) выпустить сертификат на оба имени
certbot certonly --webroot -w /var/www/certbot \
  -d ababkov-ao.ru -d www.ababkov-ao.ru \
  --agree-tos -m <EMAIL> --non-interactive

# 3) вернуть оба блока :443
nginx -t && systemctl reload nginx

# 4) автопродление
systemctl enable --now certbot.timer
systemctl list-timers | grep certbot
```

Домен рабочий — `ababkov-ao.ru`. Сертификат покрывает и `www` (SAN из двух имён), но `www` обслуживается только редиректом 301 на apex — и по HTTP, и по HTTPS. Отдельный `server`-блок `:443` для `www` обязателен: без него запрос `https://www.…` не найдёт подходящего `server_name`, получит сертификат основного домена и упрётся в ошибку несовпадения имени **вместо** редиректа.

### Ключевые директивы, которые нельзя потерять при правках

- `proxy_set_header X-Forwarded-For $remote_addr` — именно перезапись, а не `$proxy_add_x_forwarded_for`. `getClientIp()` в `src/lib/rate-limit.ts` берёт первое значение XFF, поэтому с append клиент подставил бы свой IP и обошёл rate-limit логина.
- `limit_req_zone $binary_remote_addr zone=auth_login:10m rate=5r/m` + `location = /api/auth/login` — 5 запросов/мин на IP с `burst=5 nodelay`, отдаёт 429 до того, как запрос дойдёт до приложения. Считает и успешные попытки, поэтому значение держится на уровне `LOGIN_MAX_ATTEMPTS` (`src/lib/rate-limit.ts`). При отладке можно временно добавить `limit_req_dry_run on`.
- `client_max_body_size 8m` — дефолт nginx 1m обрезал бы загрузку фотографий (приложение само лимитит 5 МБ и вернуло бы JSON-ошибку 413).
- `proxy_buffering off` — Next.js 16 стримит SSR-ответы, буферизация на прокси ломает инкрементальный рендеринг.
- Security-заголовки (HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) **не дублируются**: их уже отдаёт `next.config.ts`. `add_header` в nginx добавляет заголовок, а не заменяет — дубль HSTS дал бы расхождение `max-age` с `next.config.ts`.
- `server_tokens off` — скрывает версию nginx.
- `return 301 https://ababkov-ao.ru$request_uri` с литералом домена, а не `$host` — `$host` берётся из заголовка `Host` и мог бы утечь в `Location`.

### Проверка на сервере

```bash
nginx -t                                                             # синтаксис
curl -I http://ababkov-ao.ru                                        # 301 → https
curl -I https://ababkov-ao.ru                                       # 200, HSTS ровно один
curl -I http://www.ababkov-ao.ru                                    # 301 → https://ababkov-ao.ru
curl -I https://www.ababkov-ao.ru                                   # 301 → apex, без ошибки TLS
curl -s -o /dev/null -w '%{http_code}\n' https://ababkov-ao.ru/api/health   # 200
certbot renew --dry-run                                             # проверка продления

# XFF перезаписывается — в access log должен быть реальный IP, а не подставленный:
curl -s -H 'X-Forwarded-For: 1.2.3.4' https://ababkov-ao.ru/api/auth/login -o /dev/null
tail -n 5 /var/log/nginx/portfolio.access.log
```

---

## 7. Обновление приложения после первого деплоя

### Вариант 2 (рекомендуемый)

1. Внести изменения в код локально.
2. Пересобрать нужные образы **локально**:
   ```bash
   docker compose --env-file .env -f docker/docker-compose.yml build app
   # если менялся prisma/schema.prisma — ещё и migrator:
   docker compose --env-file .env -f docker/docker-compose.yml build migrate
   ```
3. Сохранить с меткой времени (удобно для отката):
   ```bash
   docker save -o portfolio-images-$(date +%Y%m%d-%H%M%S).tar \
     $(docker compose --env-file .env -f docker/docker-compose.yml images -q app) \
     $(docker compose --env-file .env -f docker/docker-compose.yml images -q migrate)
   ```
4. Отправить `.tar` на сервер (`scp`).
5. На сервере загрузить и перезапустить только `app`:
   ```bash
   cd ~/portfolio
   docker load -i ~/portfolio-images-*.tar
   docker compose --env-file .env -f docker/docker-compose.yml up -d --no-build app
   docker compose --env-file .env -f docker/docker-compose.yml logs -f app
   ```

> Если менялся `prisma/schema.prisma`, одного `--no-build app` мало: пересоберите и загрузите образ `migrate`, затем `docker compose --env-file .env -f docker/docker-compose.yml up -d --no-build --force-recreate migrate app` — иначе миграции не применятся.

### Вариант 1

1. Внести изменения локально, отправить только изменённые файлы (`scp` или `git`).
2. На сервере пересобрать и перезапустить:
   ```bash
   cd ~/portfolio
   docker compose --env-file .env -f docker/docker-compose.yml up -d --build app
   ```

---

## 8. Чек-лист готовности к первому деплою

- [ ] **DNS.** A-записи на `ababkov-ao.ru` и `www.ababkov-ao.ru` указывают на публичный IP Jino VPS, пропагация завершена.
- [ ] **Порты.** На Jino VPS порты 80 и 443 открыты для входящего трафика.
- [ ] **Docker.** `docker version` и `docker compose version` работают на сервере.
- [ ] **`.env`.** В `~/portfolio/.env` заполнены все runtime-переменные, права `chmod 600`. В нём нет плейсхолдеров (`AUTH_ADMIN_PASSWORD` ≠ `replace-with-strong-password`, длина ≥ 8).
- [ ] **Образы собраны локально** (Вариант 2) — без ошибок, оба: `docker-app` и `docker-migrate`.
- [ ] **Файлы перенесены**, образы загружены через `docker load`, теги совпадают с `docker compose config --images`.
- [ ] **Docker-стек поднят.** `up -d --no-build` отработал успешно, `ps` показывает `db` и `app` как `Up (healthy)`, в логах `migrate` есть `Seed completed`.
- [ ] **nginx установлен.** `docker/nginx/portfolio.conf` размещён в `sites-available`/`sites-enabled`, `nginx -t` проходит.
- [ ] **Сертификаты получены** на оба имени, `certbot.timer` включён, `certbot renew --dry-run` проходит.
- [ ] **HTTPS работает.** `https://ababkov-ao.ru` открывается, HTTP редиректит на HTTPS, `www` по обоим протоколам редиректит на apex без ошибки TLS, API-роуты отвечают.
- [ ] **Защита проверена.** `X-Forwarded-For` перезаписывается nginx (rate-limit логина не обходится подменой заголовка), nginx-овский `limit_req` на `/api/auth/login` отдаёт 429 при превышении, HSTS в ответе ровно один.
- [ ] **Автозапуск.** После перезагрузки сервера контейнеры поднимаются сами (`restart: unless-stopped`), nginx — через systemd.

---

## 9. Откат

nginx не участвует в Docker-стеке и не трогает volumes, поэтому откатывается независимо:

```bash
rm /etc/nginx/sites-enabled/portfolio.conf
systemctl reload nginx
```

Откат образа (Вариант 2) — загрузить предыдущий `.tar` и перезапустить `app`:

```bash
cd ~/portfolio
docker load -i ~/portfolio-images-20260101-120000.tar
docker compose --env-file .env -f docker/docker-compose.yml up -d --no-build app
```

Данные (БД, загруженные файлы) лежат в volumes `db-data` и `uploads` и не затрагиваются ни одним из откатов.
