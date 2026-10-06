import EnglishShell, { EN_METADATA, VIEWPORT } from "@/components/EnglishShell";
import "../globals.css";

// The English edition's root layout. The Hebrew edition has its own in app/(he)/he/layout.tsx;
// the masthead, footer and fonts live in components/EnglishShell.tsx so app/global-not-found.tsx shares them.

export const metadata = EN_METADATA;

export const viewport = VIEWPORT;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <EnglishShell>{children}</EnglishShell>;
}
