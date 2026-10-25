import "@/lib/i18n/fa/register";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {title:FORECAST.fa.meta.title,description:FORECAST.fa.meta.description,alternates:localizedAlternates("/fa/forecast")};
export const revalidate = 3600;
export default function Page() { return <ForecastPage lang="fa" />; }
