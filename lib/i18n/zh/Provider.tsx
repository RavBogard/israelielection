"use client";
import type { ReactNode } from "react";
import { LangProvider } from "../lang";
import "./register";
import { OVERLAY_DATA } from "./overlay-data";
import { setOverlays } from "../overlay-text";
setOverlays(OVERLAY_DATA, "zh");
export default function Provider({children}: {children: ReactNode}) { return <LangProvider lang="zh">{children}</LangProvider>; }
