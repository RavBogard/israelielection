import GlossaryPage from "@/components/pages/GlossaryPage";
import { localizedAlternates } from "@/lib/canonical";
import { glossaryText } from "@/lib/i18n/glossary";
export const metadata = {
  title: glossaryText("fr").title,
  description: glossaryText("fr").intro,
  alternates: localizedAlternates("/fr/glossary"),
};
export default function Page() {
  return <GlossaryPage lang="fr" />;
}
