import GlossaryPage from "@/components/pages/GlossaryPage";
import { localizedAlternates } from "@/lib/canonical";
import { glossaryText } from "@/lib/i18n/glossary";
export const metadata = {
  title: glossaryText("de").title,
  description: glossaryText("de").intro,
  alternates: localizedAlternates("/de/glossary"),
};
export default function Page() {
  return <GlossaryPage lang="de" />;
}
