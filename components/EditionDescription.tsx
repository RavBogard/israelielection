"use client";
import { currentElection, isCurrentElectionRef } from "@/lib/political-record/elections";
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
    (path ?? "").split("/").includes(currentElection().id) ||
    (!!context && isCurrentElectionRef(context.election));
  return <p>{legacyEdition ? legacy : referenceText(lang).editionNote}</p>;
}
