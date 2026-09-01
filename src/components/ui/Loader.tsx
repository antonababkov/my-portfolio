import styles from "./Loader.module.scss";

type LoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
};

export default function Loader({ size = "md", label }: LoaderProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
