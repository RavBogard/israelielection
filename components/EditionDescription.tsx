"use client";
import { usePathname } from "next/navigation";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import { referenceText } from "@/lib/i18n/reference";
import type { Lang } from "@/lib/i18n";
export default function EditionDescription({
  legacy,
  lang = "en",
}: {
  legacy: string;
  lang?: Lang;
}) {
  const { context } = useSeatContext(),
    path = usePathname();
  const legacyEdition =
    /\/elections\/il-knesset-26(?:\/|$)/.test(path ?? "") ||
    (!!context && ["2026-10-27", "il-knesset-26"].includes(context.election));
  return <p>{legacyEdition ? legacy : referenceText(lang).editionNote}</p>;
}
