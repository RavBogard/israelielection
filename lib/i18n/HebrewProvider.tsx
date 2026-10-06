"use client";

import type { ReactNode } from "react";
import { LangProvider } from "./lang";
import "./he/register";
import { OVERLAY_DATA } from "./overlay-data";
import { setOverlays } from "./overlay-text";

// Only the Hebrew root layout renders this module, so the Hebrew data rides in the Hebrew pages' client chunks
// and nowhere else. Filling the overlays at module load means they are in place before any client component
// under the layout renders, in server rendering and in the browser alike.
setOverlays(OVERLAY_DATA);

/** The Hebrew edition's client context: lang "he", with the Hebrew data overlays loaded. */
export function HebrewProvider({ children }: { children?: ReactNode }) {
  return <LangProvider lang="he">{children}</LangProvider>;
}
