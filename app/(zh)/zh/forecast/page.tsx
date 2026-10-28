import "@/lib/i18n/zh/register";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {title:FORECAST.zh.meta.title,description:FORECAST.zh.meta.description,alternates:localizedAlternates("/zh/forecast")};
export const revalidate = 60; // election night: the count method section carries live figures (was 3600)
export default function Page() { return <ForecastPage lang="zh" />; }
