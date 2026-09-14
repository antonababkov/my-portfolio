import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      style={{
        width: "100%",
        maxWidth: 600,
        marginInline: "auto",
        padding: "4rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", margin: 0 }}>404</h1>
      <p style={{ fontSize: "1.125rem", color: "var(--color-foreground-secondary)", margin: 0 }}>
        Страница не найдена
      </p>
      <Link
        href="/"
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem 1.5rem",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "transparent",
          color: "var(--color-foreground)",
          fontSize: "0.875rem",
        }}
      >
        На главную
      </Link>
    </main>
  );
}
