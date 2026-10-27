import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { localizedAlternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("fr").title,
  description: correctionText("fr").intro,
  alternates: localizedAlternates("/fr/corrections"),
};
export default function Page() {
  return <CorrectionsPage lang="fr" />;
}
