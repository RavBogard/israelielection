"use client";
import { useEffect, useState } from "react";
import { locale, type Lang } from "./i18n";
import { EXIT_LINE } from "./i18n/exit-line";

const clock = (iso: string, lang: Lang, timeZone: string) =>
  new Intl.DateTimeFormat(locale(lang), { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

/** The reader's time zone, known only in the browser: null on the server and for the first client render, so the markup matches. */
export function useReaderZone(): string | null {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => { try { setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || null); } catch { setZone(null); } }, []);
  return zone;
}

/**
 * "22:09 Israel time (15:09 your time)": the clock time in Israel, and the reader's own when their zone gives
 * a different one. Date-only values have no clock time and come back unchanged-free (null).
 */
export function israelAndLocal(iso: string, lang: Lang, zone: string | null): string | null {
  if (!iso.includes("T")) return null;
  const t = EXIT_LINE[lang];
  const il = clock(iso, lang, "Asia/Jerusalem");
  const local = zone && zone !== "Asia/Jerusalem" ? clock(iso, lang, zone) : null;
  return local && local !== il ? `${il} ${t.israelTime} (${local} ${t.yourTime})` : `${il} ${t.israelTime}`;
}
