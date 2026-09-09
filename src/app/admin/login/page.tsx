import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import Login from "@/components/admin/Login";
import styles from "./login.module.scss";

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/admin");
  }

  return (
    <div id="main" className={styles.page}>
      <div className={styles.wrap}>
        <Link href="/" className={styles.homeLink}>
          На главную
        </Link>
        <Login />
      </div>
    </div>
  );
}
