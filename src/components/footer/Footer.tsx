"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  CONTACTS,
  SOCIALS,
  PRIVACY_POLICY_TEXT,
  PERSONAL_DATA_POLICY_TEXT,
} from "@/lib/constants";
import styles from "./Footer.module.scss";

type PolicyKey = "privacy" | "personalData" | null;

export default function Footer() {
  const [openPolicy, setOpenPolicy] = useState<PolicyKey>(null);

  const policies: Record<Exclude<PolicyKey, null>, { title: string; text: string }> = {
    privacy: { title: "Политика конфиденциальности", text: PRIVACY_POLICY_TEXT },
    personalData: {
      title: "Правила обработки персональных данных",
      text: PERSONAL_DATA_POLICY_TEXT,
    },
  };

  const currentPolicy = openPolicy ? policies[openPolicy] : null;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.contacts}>
          <p className={styles.copyright}>
            {new Date().getFullYear()} © Все права защищены
          </p>
          <a className={styles.contactLink} href={`mailto:${CONTACTS.email}`}>
            {CONTACTS.email}
          </a>
          <a className={styles.contactLink} href={`tel:${CONTACTS.phone.replace(/[^+\d]/g, "")}`}>
            {CONTACTS.phone}
          </a>
        </div>

        <nav className={styles.socials} aria-label="Социальные сети">
          {SOCIALS.map((social) => (
            <a
              key={social.id}
              className={styles.socialLink}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.label}
            </a>
          ))}
        </nav>

        <nav className={styles.policies} aria-label="Документы">
          <button
            type="button"
            className={styles.policyLink}
            onClick={() => setOpenPolicy("privacy")}
          >
            Политика конфиденциальности
          </button>
          <button
            type="button"
            className={styles.policyLink}
            onClick={() => setOpenPolicy("personalData")}
          >
            Правила обработки ПДн
          </button>
        </nav>
      </div>

      <Modal
        open={!!currentPolicy}
        title={currentPolicy?.title}
        onClose={() => setOpenPolicy(null)}
      >
        <div className={styles.policyText}>{currentPolicy?.text}</div>
      </Modal>
    </footer>
  );
}