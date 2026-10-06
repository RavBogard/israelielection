import type { ReactNode } from "react";

/**
 * The page head every page shares: the title at the one display size, then at most one standfirst.
 * Children follow the standfirst (a .ph-meta line, a preset link). `aside` holds a tool's controls,
 * set right of the title on wide screens and under it on narrow ones. An embedded tool passes as="h2".
 */
export default function PageHead({ title, standfirst, children, aside, as: H = "h1", className }: { title: ReactNode; standfirst?: ReactNode; children?: ReactNode; aside?: ReactNode; as?: "h1" | "h2"; className?: string }) {
  const main = (
    <>
      <H className="ph-title">{title}</H>
      {standfirst != null && <p className="standfirst">{standfirst}</p>}
      {children}
    </>
  );
  return (
    <header className={`page-head${aside ? " has-aside" : ""}${className ? ` ${className}` : ""}`}>
      {aside ? <><div className="ph-main">{main}</div><div className="ph-aside">{aside}</div></> : main}
    </header>
  );
}
