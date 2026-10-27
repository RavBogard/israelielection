import StartPage from "@/components/pages/StartPage";
import { localizedAlternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("de").title,
  description: journeyText("de").intro,
  alternates: localizedAlternates("/de/start"),
};
export default function Page() {
  return <StartPage lang="de" />;
}
