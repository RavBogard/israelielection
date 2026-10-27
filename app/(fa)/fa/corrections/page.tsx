import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { localizedAlternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("fa").title,
  description: correctionText("fa").intro,
  alternates: localizedAlternates("/fa/corrections"),
};
export default function Page() {
  return <CorrectionsPage lang="fa" />;
}
