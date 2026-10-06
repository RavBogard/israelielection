import { Frank_Ruhl_Libre, Public_Sans } from "next/font/google";

// Frank Ruhl Libre is the Latin companion of Frank-Rühl, the face Hebrew newspapers have been
// set in since 1910: it carries the headlines, the seat numbers and the prose. Public Sans, the
// face of the teaching deck, carries the interface: labels, tables, controls.
// Shared by both editions' root layouts; the Hebrew sans (IBM Plex Sans Hebrew) is declared only in
// app/(he)/he/layout.tsx so English pages never load it.
export const frank = Frank_Ruhl_Libre({ variable: "--font-frank", subsets: ["latin", "hebrew"], weight: ["400", "500", "700", "900"] });
export const sans = Public_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
