import "@/lib/i18n/ar/register";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {title:FORECAST.ar.meta.title,description:FORECAST.ar.meta.description,alternates:localizedAlternates("/ar/forecast")};
export const revalidate = 60; // election night: the count method section carries live figures (was 3600)
export default function Page() { return <ForecastPage lang="ar" />; }
