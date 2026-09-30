"use client";

import { METRIKA_ID } from "@/lib/constants";
import { initMetrika } from "@/lib/metrika";

export const CONSENT_COOKIE = "pmt-consent";
export const CONSENT_EVENT = "consent:open";
const COOKIE_TTL = 60 * 60 * 24 * 365; // 1 год

export type ConsentValue = "accepted" | "declined";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; max-age=${COOKIE_TTL}; path=/; samesite=lax`;
}

export function getConsent(): ConsentValue | null {
  const value = readCookie(CONSENT_COOKIE);
  return value === "accepted" || value === "declined" ? value : null;
}

export function acceptConsent() {
  writeCookie(CONSENT_COOKIE, "accepted");
  writeCookie("ym", "1");
  initMetrika(METRIKA_ID);
}

export function declineConsent() {
  writeCookie(CONSENT_COOKIE, "declined");
  writeCookie("ym", "0");
}

export function openConsent() {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}