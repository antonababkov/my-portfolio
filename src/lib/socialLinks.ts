import type { SocialLink } from "@/types";

export const SOCIAL_LINKS_MAX = 10;

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .slice(0, SOCIAL_LINKS_MAX)
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id ? item.id : `social-${index}`,
      label: typeof item.label === "string" ? item.label.trim() : "",
      url: typeof item.url === "string" ? item.url.trim() : "",
    }))
    .filter((item) => item.label !== "" && isHttpUrl(item.url));
}
