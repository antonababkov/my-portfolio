import { cache } from "react";
import { db } from "@/lib/db";
import { normalizeSocialLinks } from "@/lib/socialLinks";
import type { Profile } from "@/types";

export const getProfile = cache(async (): Promise<Profile | null> => {
  const profile = await db.profile.findFirst({
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!profile) return null;

  return {
    ...profile,
    socialLinks: normalizeSocialLinks(profile.socialLinks),
  };
});

export const getProjects = cache(async () => {
  return db.project.findMany({
    orderBy: { order: "asc" },
    include: { photos: { orderBy: { order: "asc" } } },
  });
});