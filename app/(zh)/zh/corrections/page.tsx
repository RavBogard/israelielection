import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { localizedAlternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("zh").title,
  description: correctionText("zh").intro,
  alternates: localizedAlternates("/zh/corrections"),
};
export default function Page() {
  return <CorrectionsPage lang="zh" />;
}
