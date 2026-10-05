"use client";
import { usePathname } from "next/navigation";
import { correctionHref } from "@/lib/corrections";
/** The click captures query/hash selections too; the rendered link already has a useful page address. */
export default function CorrectionLink({ page }: { page?: string }) {
  const path = usePathname();
  return <a href={correctionHref(page ?? path)} onClick={(event) => { if (!page) event.currentTarget.href = correctionHref(window.location.href); }}>Report a correction</a>;
}
