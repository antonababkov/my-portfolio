import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Login from "@/components/admin/Login";
import styles from "./login.module.scss";

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/admin");
  }

  return (
    <div className={styles.page}>
      <Login />
    </div>
  );
}
