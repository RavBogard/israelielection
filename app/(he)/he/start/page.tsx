import StartPage from "@/components/pages/StartPage";
import { localizedAlternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("he").title,
  description: journeyText("he").intro,
  alternates: localizedAlternates("/he/start"),
};
export default function Page() {
  return <StartPage lang="he" />;
}
