"use client";
import { useSyncExternalStore } from "react";
import { locale, type Lang } from "@/lib/i18n";
import { EXIT_TABLE } from "@/lib/i18n/exit-table";

const H23 = (timeZone?: string) => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const israel = H23("Asia/Jerusalem");
const noSubscribe = () => () => {};
const readerZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
const serverZone = () => null;

/**
 * When an exit poll aired: Israel time, the same on server and client; then, in the browser only, the reader's own
 * time in brackets when it differs ("22:44 Israel time (3:44 PM your time)"). The server never renders the reader's
 * zone, so there is no hydration mismatch.
 */
export default function AirTime({ at, lang, updated = false }: { at: string; lang: Lang; updated?: boolean }) {
  const x = EXIT_TABLE[lang], d = new Date(at), il = israel.format(d);
  const zone = useSyncExternalStore(noSubscribe, readerZone, serverZone);
  const local = zone && H23(zone).format(d) !== il ? new Intl.DateTimeFormat(locale(lang), { hour: "numeric", minute: "2-digit" }).format(d) : null;
  return (
    <span className="xt-time" data-testid="exit-air-time">
      {(updated ? x.updated : x.aired)(il)}
      {local && <span className="xt-local">{x.yourTime(local)}</span>}
    </span>
  );
}
