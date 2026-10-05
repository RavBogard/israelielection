import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Chart, Note, Positions, Quote } from "@/components/article/Article";
import WhatIf from "@/components/article/WhatIf";

// Every MDX page gets the article blocks without importing them; internal links route client-side.
const components = {
  Chart,
  Positions,
  Quote,
  Note,
  WhatIf,
  a: ({ href = "", children }) => (href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>),
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
