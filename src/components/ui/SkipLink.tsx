import styles from "./SkipLink.module.scss";

export function SkipLink() {
  return (
    <a href="#main" className={styles.skipLink}>
      Перейти к содержимому
    </a>
  );
}