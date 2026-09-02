import { cache } from "react";
import { db } from "@/lib/db";

export const getProfile = cache(async () => {
  return db.profile.findFirst({
    include: { photos: { orderBy: { order: "asc" } } },
  });
});

export const getProjects = cache(async () => {
  return db.project.findMany({
    orderBy: { order: "asc" },
    include: { photos: { orderBy: { order: "asc" } } },
  });
});