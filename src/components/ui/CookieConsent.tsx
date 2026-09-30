"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  CONSENT_EVENT,
  acceptConsent,
  declineConsent,
  getConsent,
} from "@/lib/consent";
import { initMetrika } from "@/lib/metrika";
import { METRIKA_ID } from "@/lib/constants";
import styles from "./CookieConsent.module.scss";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const consent = getConsent();
      if (consent === "accepted") {
        initMetrika(METRIKA_ID);
      } else if (consent !== "declined") {
        setVisible(true);
      }
    }, 0);

    function handleOpen() {
      if (cancelled) return;
      setVisible(true);
    }

    window.addEventListener(CONSENT_EVENT, handleOpen);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(CONSENT_EVENT, handleOpen);
    };
  }, []);

  function handleAccept() {
    acceptConsent();
    setVisible(false);
  }

  function handleDecline() {
    declineConsent();
    setVisible(false);
  }

  function handleClose() {
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className={styles.banner} aria-label="Согласие на аналитику">
      <p className={styles.text}>
        Для статистики посещаемости сайт может использовать Яндекс.Метрику.
        Счётчик подключается только после вашего согласия и собирает
        обезличенные данные.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" size="sm" onClick={handleAccept}>
          Принять
        </Button>
        <Button variant="outline" size="sm" onClick={handleDecline}>
          Отказаться
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          Закрыть
        </Button>
      </div>
    </aside>
  );
}