export function photoUrl(url: string): string {
  return url.startsWith("/uploads/") ? `/api${url}` : url;
}
