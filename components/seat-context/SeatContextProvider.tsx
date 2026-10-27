"use client";
import {
  authoritativeEdition,
  canonicalSeatEdition,
  blocksCurrentContext,
  initialContextWins,
  compatibleInitialEdition,
} from "./edition-state";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { CadenceMetadata } from "@/lib/election-lifecycle/cadence";
import { acceptsSeatContext, changedSeats } from "@/lib/seat-context";

type SeatState = {
  context: SharedSeatContext | null;
  changes: ReturnType<typeof changedSeats>;
  refreshFailed: boolean;
  blockedByEdition?: boolean;
  forecastComplete?: boolean;
  cadence?: CadenceMetadata;
};
const SeatStore = createContext<SeatState | null>(null);

/** A single visible-tab refresh serves the masthead and all current tools. Explicit pins never follow it. */
export default function SeatContextProvider({
  initial,
  children,
}: {
  initial: SharedSeatContext | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<SeatState>({
    context: initial,
    changes: [],
    refreshFailed: !initial,
    forecastComplete: initial?.freshness.status === "complete",
  });
  const latest = useRef(initial);
  const authoritativeCurrent = useRef<string | null>(null);
  const currentEdition = useRef(
    initial ? canonicalSeatEdition(initial.election) : null,
  );
  useEffect(() => {
    if (
      !initial ||
      !compatibleInitialEdition(initial, authoritativeCurrent.current) ||
      !acceptsSeatContext(
        latest.current?.election === initial.election ? latest.current : null,
        initial,
      )
    )
      return;
    currentEdition.current = canonicalSeatEdition(initial.election);
    const previous = latest.current;
    latest.current = initial;
    setState((state) => ({
      context: initial,
      changes:
        previous &&
        previous.election === initial.election &&
        previous.revision !== initial.revision
          ? changedSeats(previous, initial)
          : state.changes,
      refreshFailed: false,
      forecastComplete:
        (previous?.election === initial.election && state.forecastComplete) ||
        initial.freshness.status === "complete",
      cadence: state.cadence,
    }));
  }, [initial]);
  useEffect(() => {
    let disposed = false,
      controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      if (disposed || document.visibilityState === "hidden") return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => {
        request.abort();
        if (!disposed)
          setState((previous) => ({ ...previous, refreshFailed: true }));
      }, 10000);
      try {
        const response = await fetch("/api/election-lifecycle?view=seats", {
          signal: request.signal,
          cache: "no-store",
        });
        const body = await response.json();
        if (disposed || request.signal.aborted) return;
        const edition = authoritativeEdition(body);
        if (edition) authoritativeCurrent.current = edition;
        const editionChanged = !!edition && edition !== currentEdition.current;
        if (editionChanged) {
          currentEdition.current = edition;
          if (blocksCurrentContext(latest.current, edition)) {
            latest.current = null;
            setState({
              context: null,
              changes: [],
              refreshFailed: true,
              blockedByEdition: true,
            });
          }
          router.refresh();
        }
        if (!response.ok) throw new Error("Seat context unavailable");
        const next = body.seatContext as SharedSeatContext;
        if (
          !next?.pointSeats ||
          blocksCurrentContext(next, edition) ||
          !next.freshness ||
          !acceptsSeatContext(latest.current, next)
        )
          return;
        if (disposed || request.signal.aborted) return;
        const previous = latest.current;
        latest.current = next;
        setState({
          context: next,
          changes:
            previous && previous.revision !== next.revision
              ? changedSeats(previous, next)
              : [],
          refreshFailed: false,
          forecastComplete:
            body.archive?.electionForecast === "complete" ||
            next.freshness.status === "complete",
          cadence: body.cadence,
        });
        if (
          !editionChanged &&
          (!previous || previous.revision !== next.revision)
        )
          router.refresh();
      } catch {
        if (!disposed && !request.signal.aborted)
          setState((previous) => ({ ...previous, refreshFailed: true }));
      } finally {
        clearTimeout(timeout);
        if (!disposed && controller === request)
          timer = setTimeout(refresh, 30_000);
      }
    };
    const visibility = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") void refresh();
      else controller?.abort();
    };
    document.addEventListener("visibilitychange", visibility);
    void refresh();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [router]);
  return <SeatStore.Provider value={state}>{children}</SeatStore.Provider>;
}

export function useSeatContext(
  initial?: SharedSeatContext | null,
  pinned = false,
): SeatState {
  const shared = useContext(SeatStore);
  return pinned
    ? { context: initial ?? null, changes: [], refreshFailed: false }
    : shared?.blockedByEdition
      ? shared
      : initial && initialContextWins(initial, shared?.context)
        ? {
            context: initial,
            changes: shared?.changes ?? [],
            refreshFailed: shared?.refreshFailed ?? false,
            cadence: shared?.cadence,
          }
        : (shared ?? {
            context: initial ?? null,
            changes: [],
            refreshFailed: false,
            forecastComplete: initial?.freshness.status === "complete",
          });
}
