import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { localizedAlternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("he").title,
  description: correctionText("he").intro,
  alternates: localizedAlternates("/he/corrections"),
};
export default function Page() {
  return <CorrectionsPage lang="he" />;
}
