import StartPage from "@/components/pages/StartPage";
import { localizedAlternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("fa").title,
  description: journeyText("fa").intro,
  alternates: localizedAlternates("/fa/start"),
};
export default function Page() {
  return <StartPage lang="fa" />;
}
