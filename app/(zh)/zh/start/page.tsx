import StartPage from "@/components/pages/StartPage";
import { localizedAlternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("zh").title,
  description: journeyText("zh").intro,
  alternates: localizedAlternates("/zh/start"),
};
export default function Page() {
  return <StartPage lang="zh" />;
}
