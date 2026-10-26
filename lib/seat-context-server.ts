import { cache } from "react";
import {
  getElectionLifecycle,
  getSharedSeatContext,
} from "./election-lifecycle/server";

/** Primitive keys share one qualified snapshot across the shell and all server consumers in a render. */
export const seatContextForRender = cache(async (revision?: string) => {
  const result = await getSharedSeatContext(revision ? { revision } : {});
  return result.state === "ready" ? result.context : null;
});
export const lifecycleForRender = cache(async (revision?: string) =>
  getElectionLifecycle(revision ? { revision } : {}),
);
