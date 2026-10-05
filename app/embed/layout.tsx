import type { ReactNode } from "react";
import "@/components/embed.css";

/** Chrome-less widgets for educators to iframe. The root masthead and footer are hidden by embed.css. */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <div className="embed-page">{children}</div>;
}
