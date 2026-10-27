import GlossaryPage from "@/components/pages/GlossaryPage";
import { localizedAlternates } from "@/lib/canonical";
import { glossaryText } from "@/lib/i18n/glossary";
export const metadata = {
  title: glossaryText("he").title,
  description: glossaryText("he").intro,
  alternates: localizedAlternates("/he/glossary"),
};
export default function Page() {
  return <GlossaryPage lang="he" />;
}
