import "@/lib/i18n/de/register";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {title:FORECAST.de.meta.title,description:FORECAST.de.meta.description,alternates:localizedAlternates("/de/forecast")};
export const revalidate = 3600;
export default function Page() { return <ForecastPage lang="de" />; }
