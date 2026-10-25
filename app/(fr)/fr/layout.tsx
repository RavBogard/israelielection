import type { ReactNode } from "react";
import Provider from "@/lib/i18n/fr/Provider";
import RtlLayout, { toolMetadata } from "@/components/RtlLayout";
export const metadata = toolMetadata("fr");
export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#121210" }] };
export default function Layout({children}: {children: ReactNode}) { return <RtlLayout lang="fr" provider={Provider}>{children}</RtlLayout>; }
