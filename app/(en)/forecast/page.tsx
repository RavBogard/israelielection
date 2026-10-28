import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";

export const metadata: Metadata = { title: FORECAST.en.meta.title, description: FORECAST.en.meta.description, alternates: alternates("/forecast") };

// The page reads data/forecast.json at build; the polls job's commit redeploys it.
export const revalidate = 60; // election night: the count method section carries live figures (was 3600)

export default function Page() {
  return <ForecastPage lang="en" />;
}
