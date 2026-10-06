"use client";
import { usePathname } from "next/navigation";
import { correctionHref } from "@/lib/corrections";

/**
 * The Hebrew sources box's correction link (components/CorrectionLink.tsx carries the English words). The
 * corrections page is English, so the link says so.
 */
export default function SourcesCorrection({ label }: { label: string }) {
  const path = usePathname();
  return <a href={correctionHref(path)} hrefLang="en" onClick={(event) => { event.currentTarget.href = correctionHref(window.location.href); }}>{label}</a>;
}
