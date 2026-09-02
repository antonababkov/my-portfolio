export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

const THEME_CHANGE_EVENT = "themechange";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Тема, применённая к <html data-theme> инлайн-скриптом до гидрации.
// Безопасен для SSR: на сервере всегда "light".
export function getAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const value = document.documentElement.dataset.theme;
  return value === "dark" ? "dark" : "light";
}

// Подписка для useSyncExternalStore: уведомляем слушателей при смене темы.
export function subscribeTheme(onChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage может быть недоступен (приватный режим, ограничения)
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

// Строка для inline-скрипта в <head>: ставит data-theme до гидрации,
// чтобы не было «мигания» темы (FOUC).
export const themeInitScript = `(function(){var k="${THEME_STORAGE_KEY}";var s=null;try{s=window.localStorage.getItem(k);}catch(e){}var t=s==="light"||s==="dark"?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;window.dispatchEvent(new Event("${THEME_CHANGE_EVENT}"));})();`;