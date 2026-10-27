import CorrectionsPage from "@/components/pages/CorrectionsPage";
import { alternates } from "@/lib/canonical";
import { correctionText } from "@/lib/i18n/corrections";
export const metadata = {
  title: correctionText("en").title,
  description: correctionText("en").intro,
  alternates: alternates("/corrections"),
};
export default function Page() {
  return <CorrectionsPage />;
}
