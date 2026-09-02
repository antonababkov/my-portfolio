"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Login.module.scss";

export default function Login() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось войти");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Вход в админ-панель</h1>

      <label className={styles.field}>
        <span className={styles.label}>Логин</span>
        <input
          className={styles.input}
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          autoComplete="username"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Пароль</span>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
