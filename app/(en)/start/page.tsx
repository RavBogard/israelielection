import StartPage from "@/components/pages/StartPage";
import { alternates } from "@/lib/canonical";
import { journeyText } from "@/lib/i18n/journeys";
export const metadata = {
  title: journeyText("en").title,
  description: journeyText("en").intro,
  alternates: alternates("/start"),
};
export default function Page() {
  return <StartPage />;
}
