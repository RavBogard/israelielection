"use client";
import type { ReactNode } from "react";
import { useSeatContext } from "./seat-context/SeatContextProvider";

/**
 * Exit polls leave the masthead once the count drives the seats (Daniel, 2026-10-28); the strip under it then
 * shows the count. Before that (campaign, or the exit-poll stage on the night) the line shows as before.
 */
export default function ExitLineGate({ children }: { children: ReactNode }) {
  const { context } = useSeatContext();
  if (context && (context.evidenceStage === "counting" || context.evidenceStage === "official")) return null;
  return <>{children}</>;
}
