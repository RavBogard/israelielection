import StartPage from "@/components/pages/StartPage";
import { localizedAlternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("fr").title,
  description: journeyText("fr").intro,
  alternates: localizedAlternates("/fr/start"),
};
export default function Page() {
  return <StartPage lang="fr" />;
}
