import GlossaryPage from "@/components/pages/GlossaryPage";
import { localizedAlternates } from "@/lib/canonical";
import { glossaryText } from "@/lib/i18n/glossary";
export const metadata = {
  title: glossaryText("ar").title,
  description: glossaryText("ar").intro,
  alternates: localizedAlternates("/ar/glossary"),
};
export default function Page() {
  return <GlossaryPage lang="ar" />;
}
