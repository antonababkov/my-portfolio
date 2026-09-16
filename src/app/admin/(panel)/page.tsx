import AdminDashboard from "@/components/admin/AdminDashboard";

type SearchParams = { tab?: string | string[] | undefined };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { tab } = await searchParams;
  const raw = Array.isArray(tab) ? tab[0] : tab;

  const initialTab: "about" | "projects" | "settings" | undefined =
    raw === "about" || raw === "projects" || raw === "settings"
      ? raw
      : undefined;

  return <AdminDashboard initialTab={initialTab} />;
}