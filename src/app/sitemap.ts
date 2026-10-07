import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

// Дата фиксируется в момент сборки/первой генерации sitemap,
// а не вычисляется на каждый запрос.
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}