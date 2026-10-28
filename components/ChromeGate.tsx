"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The embeds are bare widgets for other sites' iframes: the masthead, nav and footer are left out of their HTML, not only hidden by CSS. */
export default function ChromeGate({ children }: { children: ReactNode }) {
  return /^\/(?:[a-z]{2}\/)?embed(?:\/|$)/.test(usePathname() ?? "") ? null : <>{children}</>;
}
