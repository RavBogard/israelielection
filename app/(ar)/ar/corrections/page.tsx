import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { localizedAlternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("ar").title,
  description: correctionText("ar").intro,
  alternates: localizedAlternates("/ar/corrections"),
};
export default function Page() {
  return <CorrectionsPage lang="ar" />;
}
