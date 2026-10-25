import type { ReactNode } from "react";
import Provider from "@/lib/i18n/de/Provider";
import RtlLayout, { toolMetadata } from "@/components/RtlLayout";
export const metadata = toolMetadata("de");
export const viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#121210" }] };
export default function Layout({children}: {children: ReactNode}) { return <RtlLayout lang="de" provider={Provider}>{children}</RtlLayout>; }
