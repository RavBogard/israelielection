import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { localizedAlternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("de").title,
  description: correctionText("de").intro,
  alternates: localizedAlternates("/de/corrections"),
};
export default function Page() {
  return <CorrectionsPage lang="de" />;
}
