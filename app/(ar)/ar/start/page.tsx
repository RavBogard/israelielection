import StartPage from "@/components/pages/StartPage";
import { localizedAlternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("ar").title,
  description: journeyText("ar").intro,
  alternates: localizedAlternates("/ar/start"),
};
export default function Page() {
  return <StartPage lang="ar" />;
}
