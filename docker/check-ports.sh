#!/usr/bin/env bash
# ============================================================
# check-ports.sh — проверка, публикует ли Docker порты контейнеров
# напрямую через iptables (в обход UFW). СКРИПТ ТОЛЬКО ЧИТАЕТ,
# никаких правил и конфигов не меняет.
#
# Запуск на VPS из корня проекта (~/portfolio):
#   chmod +x docker/check-ports.sh
#   ./docker/check-ports.sh
#   sudo ./docker/check-ports.sh    # без повторных запросов sudo
#
# Ожидаемо для этого проекта:
#   * наружу: 80/443 (nginx на хосте) и 22/SSH;
#   * app — только 127.0.0.1:3000;
#   * db  — без публикации ports вообще.
#
# Почему это важно: UFW фильтрует INPUT, а Docker вставляет свои
# правила в nat/PREROUTING/OUTPUT и filter/FORWARD (цепочки DOCKER,
# DOCKER-USER). Эти правила UFW не видит, поэтому «ufw status: 80/443»
# ничего не говорит о портах контейнеров.
#
# Код возврата: 0 — проблем нет, 1 — найдена публикация наружу.
# ============================================================

set -uo pipefail

issues=0
warns=0
external_port_seen=0

section() { printf '\n== %s ==\n' "$1"; }
pass()    { printf '  [ OK ] %s\n' "$1"; }
warn()    { warns=$((warns + 1)); printf '  [WARN] %s\n' "$1"; }
fail()    { issues=$((issues + 1)); printf '  [FAIL] %s\n' "$1"; }
note()    { printf '  [note] %s\n' "$1"; }

SUDO=""
no_root=0
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    no_root=1
  fi
fi

run_root() {
  if [ "$no_root" -eq 1 ]; then
    return 127
  fi
  $SUDO "$@"
}

# docker может быть доступен без root (группа docker) или только через sudo.
docker_out() {
  local out
  if out=$(docker "$@" 2>/dev/null); then
    printf '%s\n' "$out"
    return 0
  fi
  if out=$(run_root docker "$@" 2>/dev/null); then
    printf '%s\n' "$out"
    return 0
  fi
  return 1
}

# ------------------------------------------------------------
section "1. Публикации портов в Docker (docker ps)"
if ! command -v docker >/dev/null 2>&1; then
  fail "docker не найден"
else
  ps_out=$(docker_out ps --format '{{.Names}}\t{{.Ports}}') || ps_out=""
  if [ -z "$ps_out" ]; then
    warn "docker ps не вернул контейнеров (стек не запущен или нет прав)"
  else
    printf '%s\n' "$ps_out" | sed 's/^/    /'

    if printf '%s\n' "$ps_out" | grep -Eq '(0\.0\.0\.0|\[::\]):'; then
      external_port_seen=1
      fail "есть публикация во все интерфейсы (0.0.0.0/[::]) — доступна извне в обход UFW"
    else
      pass "все опубликованные порты привязаны к loopback (127.0.0.1)"
    fi

    if printf '%s\n' "$ps_out" | grep -Eq '(0\.0\.0\.0|\[::\]):(3000|5432)\b'; then
      external_port_seen=1
      fail "app/db опубликованы наружу (ожидалось 127.0.0.1:3000 и без публикации у db)"
    fi

    if printf '%s\n' "$ps_out" | grep -q 'migrate'; then
      note "контейнер migrate обычно уже завершён (restart: \"no\") — это нормально"
    fi
  fi
fi

# ------------------------------------------------------------
section "2. Слушатели на хосте (ss -tlnp)"
if ! command -v ss >/dev/null 2>&1; then
  warn "ss не найден (пакет iproute2) — раздел пропущен"
else
  ss_out=$(run_root ss -tlnp 2>/dev/null) || ss_out=""
  filt=$(printf '%s\n' "$ss_out" | grep -E ':(80|443|3000|5432)([[:space:]]|$)' || true)

  if [ -z "$filt" ]; then
    warn "не найдено слушателей на 80/443/3000/5432"
  else
    printf '%s\n' "$filt" | sed 's/^/    /'
  fi

  if printf '%s\n' "$filt" | grep -Eq '(0\.0\.0\.0|\*|\[::\]):(3000|5432)([[:space:]]|$)'; then
    external_port_seen=1
    fail "3000/5432 слушают не только на loopback — проверить публикацию"
  else
    pass "3000/5432 не слушают на 0.0.0.0/[::]"
  fi

  if printf '%s\n' "$filt" | grep -q 'docker-proxy'; then
    note "docker-proxy присутствует — это нормально для опубликованных портов"
  fi
fi

# ------------------------------------------------------------
section "3. DNAT-правила Docker (iptables -t nat)"
if ! command -v iptables >/dev/null 2>&1; then
  warn "iptables не найден — возможно, система только на nft (см. раздел 5)"
elif ! run_root iptables -t nat -S >/dev/null 2>&1; then
  warn "нет прав на iptables (нужен root) — раздел пропущен"
else
  nat_docker=$(run_root iptables -t nat -S DOCKER 2>/dev/null) || nat_docker=""
  dnat_docker=$(printf '%s\n' "$nat_docker" | grep 'DNAT' || true)

  if [ -n "$dnat_docker" ]; then
    printf '%s\n' "$dnat_docker" | sed 's/^/    /'
    bad_docker=$(printf '%s\n' "$dnat_docker" | grep -v '127\.0\.0\.1' || true)
    if [ -n "$bad_docker" ]; then
      external_port_seen=1
      fail "в цепочке DOCKER есть DNAT с внешних интерфейсов — трафик уходит в контейнер (UFW его не фильтрует)"
    else
      pass "DNAT в DOCKER ограничен 127.0.0.1"
    fi
  else
    pass "в цепочке DOCKER нет DNAT (публикации во внешние интерфейсы нет)"
  fi

  dnat_output=$(run_root iptables -t nat -S OUTPUT 2>/dev/null | grep 'DNAT' || true)
  if [ -n "$dnat_output" ]; then
    printf '%s\n' "$dnat_output" | sed 's/^/    /'
    bad_output=$(printf '%s\n' "$dnat_output" | grep -v '127\.0\.0\.1' || true)
    if [ -n "$bad_output" ]; then
      external_port_seen=1
      fail "DNAT в OUTPUT без ограничения 127.0.0.1 — проверить публикацию"
    else
      pass "DNAT в OUTPUT привязан к 127.0.0.1 (loopback-only)"
    fi
  else
    pass "в OUTPUT нет DNAT"
  fi
fi

# ------------------------------------------------------------
section "4. Цепочки фильтрации Docker (filter: DOCKER-USER, DOCKER)"
if ! run_root iptables -S >/dev/null 2>&1; then
  warn "нет прав на iptables (нужен root) — раздел пропущен"
else
  if run_root iptables -S DOCKER-USER >/dev/null 2>&1; then
    printf '    DOCKER-USER:\n'
    run_root iptables -S DOCKER-USER 2>/dev/null | sed 's/^/    /'
  else
    note "цепочки DOCKER-USER нет (Docker не добавлял своих правил)"
  fi

  printf '    DOCKER (первые 10 правил):\n'
  run_root iptables -S DOCKER 2>/dev/null | head -n 11 | sed 's/^/    /'

  if run_root iptables -S DOCKER-USER 2>/dev/null | grep -qE '\-j (DROP|REJECT)'; then
    pass "в DOCKER-USER есть DROP/REJECT"
  elif [ "$external_port_seen" -eq 1 ]; then
    warn "есть публикация наружу, но в DOCKER-USER нет DROP/REJECT — хост её не ограничивает"
  else
    pass "публикации наружу нет — DROP/REJECT в DOCKER-USER не требуется"
  fi
fi

# ------------------------------------------------------------
section "5. nftables (если используется)"
if command -v nft >/dev/null 2>&1 && run_root nft list ruleset >/dev/null 2>&1; then
  nft_out=$(run_root nft list ruleset 2>/dev/null | grep -nE 'chain (DOCKER|DOCKER-USER|PREROUTING|OUTPUT)|dnat to' || true)
  if [ -z "$nft_out" ]; then
    pass "правил/цепочек Docker в nft не найдено"
  else
    printf '%s\n' "$nft_out" | sed 's/^/    /'
    note "строки 'dnat to' выше — проверьте, ограничены ли они loopback"
  fi
else
  note "nft недоступен или не используется — раздел пропущен"
fi

# ------------------------------------------------------------
section "6. Настройки Docker daemon"
if ! command -v docker >/dev/null 2>&1; then
  note "docker не найден — раздел пропущен"
else
  info_line=$(docker_out info 2>/dev/null | grep -iE '^[[:space:]]*iptables:' || true)
  if [ -z "$info_line" ]; then
    note "docker info недоступен (нужен root?) — ключ iptables не проверен"
  else
    printf '    %s\n' "$info_line"
    if printf '%s' "$info_line" | grep -qi 'false'; then
      warn "iptables: false — Docker не управляет правилами (проверьте иной механизм публикации)"
    else
      pass "Docker управляет iptables (iptables: true)"
    fi
  fi
fi

if [ -f /etc/docker/daemon.json ]; then
  printf '    /etc/docker/daemon.json:\n'
  sed 's/^/    /' /etc/docker/daemon.json
else
  note "/etc/docker/daemon.json отсутствует (настройки по умолчанию)"
fi

# ------------------------------------------------------------
section "7. UFW (для контекста, НЕ гарантирует защиту Docker)"
if command -v ufw >/dev/null 2>&1 && run_root ufw status verbose >/dev/null 2>&1; then
  run_root ufw status verbose 2>/dev/null | sed 's/^/    /'
  note "правила UFW работают в INPUT; Docker пишет в FORWARD/NAT и их не видит"
else
  note "ufw недоступен — раздел пропущен"
fi

# ------------------------------------------------------------
section "8. Внешняя проверка (выполнить с ДРУГОЙ машины)"
cat <<'EOF'
    nc -zv <IP_VPS> 3000
    nc -zv <IP_VPS> 5432
    # ожидаемо: 80/443 open, 3000/5432 filtered/refused
    # (nc с самого VPS не эквивалентен внешней проверке: трафик идёт через OUTPUT)
EOF

# ------------------------------------------------------------
section "ИТОГ"
if [ "$issues" -eq 0 ]; then
  printf '  [ OK ] Docker не публикует порты наружу. Предупреждений: %d (см. [WARN] выше).\n' "$warns"
  exit 0
fi

printf '  [FAIL] Найдено проблем: %d, предупреждений: %d.\n' "$issues" "$warns"
cat <<'EOF'
  Что делать:
    1. В docker/docker-compose.yml заменить
         ports: ["PORT:PORT"]  ->  ports: ["127.0.0.1:PORT:PORT"]
       либо убрать ports вовсе (доступ только по имени сервиса в сети internal).
    2. Перезапустить: docker compose --env-file .env -f docker/docker-compose.yml up -d --no-build
    3. Жёсткий барьер на хосте — правила в DOCKER-USER (переживают docker compose up):
         sudo iptables -I DOCKER-USER -i <внешний_интерфейс> -p tcp -m multiport --dports 3000,5432 -j DROP
    4. Повторить этот скрипт и внешнюю проверку из раздела 8.
EOF
exit 1
