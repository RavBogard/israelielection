import "@/lib/i18n/fr/register";
import ForecastPage from "@/components/pages/ForecastPage";
import FORECAST from "@/lib/i18n/forecast";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {title:FORECAST.fr.meta.title,description:FORECAST.fr.meta.description,alternates:localizedAlternates("/fr/forecast")};
export const revalidate = 3600;
export default function Page() { return <ForecastPage lang="fr" />; }
