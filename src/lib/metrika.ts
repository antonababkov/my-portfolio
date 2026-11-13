"use client";

let initialized = false;

const METRIKA_SCRIPT_SELECTOR = 'script[src*="mc.yandex.ru/metrika"]';

type YmOptions = {
  id: string;
  defer?: boolean;
  clickmap?: boolean;
  trackLinks?: boolean;
  accurateTrackBounce?: boolean;
  webvisor?: boolean;
  trackHash?: boolean;
};

type YmFunction = ((...args: unknown[]) => void) & { a?: unknown[] };

declare global {
  interface Window {
    ym?: YmFunction;
  }
}

function injectScript() {
  const existing = document.querySelector<HTMLScriptElement>(
    METRIKA_SCRIPT_SELECTOR,
  );
  if (existing) return;

  const script = document.createElement("script");
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  script.defer = true;
  script.async = true;
  document.head.appendChild(script);
}

/** Инициализирован ли счётчик на текущей странице. */
export function isMetrikaInitialized(): boolean {
  return initialized;
}

/**
 * Останавливает уже подключённый счётчик и удаляет его загруженный скрипт.
 * Полное прекращение сетевых запросов гарантирует reload страницы после
 * отзыва согласия: tag.js мог успеть запустить внутренние таймеры.
 */
export function disableMetrika() {
  initialized = false;

  if (typeof document === "undefined") return;

  document
    .querySelectorAll<HTMLScriptElement>(METRIKA_SCRIPT_SELECTOR)
    .forEach((script) => script.remove());

  window.ym = undefined;
}

/**
 * Подключает счётчик Яндекс.Метрики после согласия пользователя.
 * Собирает только базовую статистику посещаемости (без вебвизора, карт
 * кликов, целей и автоматической передачи ссылок).
 */
export function initMetrika(id: string) {
  if (!id || initialized) return;
  if (typeof window === "undefined") return;

  initialized = true;

  const options: YmOptions = {
    id,
    defer: true,
    clickmap: false,
    trackLinks: false,
    accurateTrackBounce: true,
    webvisor: false,
    trackHash: true,
  };

  if (!window.ym) {
    const ymInit: YmFunction = (...args: unknown[]) => {
      ymInit.a = ymInit.a || [];
      ymInit.a.push(args);
    };
    ymInit.a = [];
    window.ym = ymInit;
  }

  window.ym(id, "init", options);

  injectScript();
}