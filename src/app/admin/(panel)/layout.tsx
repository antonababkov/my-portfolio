import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  return children;
}
