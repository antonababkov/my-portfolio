"use client";

import { METRIKA_ID } from "@/lib/constants";
import {
  disableMetrika,
  initMetrika,
  isMetrikaInitialized,
} from "@/lib/metrika";

export const CONSENT_COOKIE = "pmt-consent";
export const CONSENT_EVENT = "consent:open";
const COOKIE_TTL = 60 * 60 * 24 * 365; // 1 год

export type ConsentValue = "accepted" | "declined";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function writeCookie(name: string, value: string) {
  // Secure: на https кука не уходит по незащищённому HTTP (в dev на
  // http://localhost флаг не ставим — иначе браузер её не сохранит).
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${value}; max-age=${COOKIE_TTL}; path=/; samesite=lax${secure}`;
}

function deleteCookie(name: string) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  const base = `${name}=; max-age=0; path=/; samesite=lax${secure}`;
  document.cookie = base;

  // Куки Метрики могут быть выставлены на родительский домен
  // (например, .ababkov-ao.ru) — удаляем и такие варианты.
  const host = location.hostname;
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":");
  if (host && host !== "localhost" && !isIp) {
    const parts = host.split(".");
    for (let i = 0; i < parts.length - 1; i++) {
      document.cookie = `${base}; domain=.${parts.slice(i).join(".")}`;
    }
  }
}

/** Удаляет cookie, которые выставляет Яндекс.Метрика, и наш флаг ym. */
function clearMetrikaCookies() {
  const names = new Set<string>(["ym"]);

  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim();
    if (
      name &&
      (/^_ym_/.test(name) ||
        /^(?:yandexuid|yandex_login|i|yabs|ymex)$/.test(name))
    ) {
      names.add(name);
    }
  }

  names.forEach(deleteCookie);
}

export function getConsent(): ConsentValue | null {
  const value = readCookie(CONSENT_COOKIE);
  return value === "accepted" || value === "declined" ? value : null;
}

export function acceptConsent() {
  writeCookie(CONSENT_COOKIE, "accepted");
  writeCookie("ym", "1");
  initMetrika(METRIKA_ID);
}

export function declineConsent() {
  const wasInitialized = isMetrikaInitialized();

  disableMetrika();
  clearMetrikaCookies();
  writeCookie(CONSENT_COOKIE, "declined");
  writeCookie("ym", "0");

  // Уже загруженный tag.js мог запустить свои таймеры и запросы.
  // Перезагрузка гарантированно останавливает счётчик; при отказе на
  // стартовом баннере (счётчик ещё не подключён) reload не нужен.
  if (wasInitialized) {
    window.location.reload();
  }
}

export function openConsent() {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}