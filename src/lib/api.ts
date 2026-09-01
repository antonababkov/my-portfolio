import { db } from "@/lib/db";

export async function getProfile() {
  return db.profile.findFirst({
    include: { photos: { orderBy: { order: "asc" } } },
  });
}

export async function getProjects() {
  return db.project.findMany({
    orderBy: { order: "asc" },
    include: { photos: { orderBy: { order: "asc" } } },
  });
}