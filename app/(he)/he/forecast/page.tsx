// Loads the Hebrew interface words before this module reads them (lib/i18n/he-text.ts).
import "@/lib/i18n/he/register";
import type { Metadata } from "next";
import { heAlternates } from "@/lib/canonical";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";

export const metadata: Metadata = { title: FORECAST.he.meta.title, description: FORECAST.he.meta.description, alternates: heAlternates("/he/forecast") };

export const revalidate = 60; // election night: the count method section carries live figures (was 3600)

export default function Page() {
  return <ForecastPage lang="he" />;
}
