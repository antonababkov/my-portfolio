import LogoutButton from "@/components/admin/LogoutButton";
import styles from "./page.module.scss";

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Админ-панель</h1>
        <LogoutButton />
      </header>

      <p className={styles.note}>
        Разделы редактирования появятся здесь на следующем этапе. Функция
        авторизации уже работает: сессия защищена JWT в httpOnly-cookie.
      </p>
    </main>
  );
}
