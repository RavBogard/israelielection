"use client";
import type { ReactNode } from "react";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { FORMATION } from "@/lib/i18n/formation-live";
import type { Lang } from "@/lib/i18n";
import { useSeatContext } from "./SeatContextProvider";
export default function EvidenceGate({
  initial,
  official = false,
  children,
}: {
  initial: SharedSeatContext | null;
  official?: boolean;
  children: ReactNode;
}) {
  const { context } = useSeatContext(initial);
  return (context?.seatStatus === "official") === official ? children : null;
}
export function ResultsHeading({
  initial,
  lang,
  children,
  title,
}: {
  initial: SharedSeatContext | null;
  lang: Lang;
  children: ReactNode;
  title: string;
}) {
  const { context } = useSeatContext(initial);
  return context?.seatStatus === "official" ? (
    <header className="page-head">
      <h1>{title}</h1>
      <p>{FORMATION[lang].completed}</p>
    </header>
  ) : (
    children
  );
}
