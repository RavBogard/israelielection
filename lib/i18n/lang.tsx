"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "./index";

/** The edition a client component renders in. English needs no provider; only the Hebrew root layout sets one. */
const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children?: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}
