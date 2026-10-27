import type { Metadata } from "next";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { briefingSentence } from "@/lib/briefing-locale";
import { briefingCopy } from "@/lib/i18n/briefing";
import { editionPath, type Lang } from "@/lib/i18n";
export function briefingMetadata(lang: Lang, date?: string): Metadata {
  const b = date
      ? (briefingsJson as Briefing[]).find((item) => item.date === date)
      : (briefingsJson as Briefing[])[0],
    ready = b && b.sentences.every((s) => briefingSentence(s, lang).text);
  return {
    title: briefingCopy(lang).title,
    alternates: {
      canonical: editionPath("/news" + (date ? "/" + date : ""), lang),
    },
    robots: ready ? undefined : { index: false, follow: true },
  };
}
