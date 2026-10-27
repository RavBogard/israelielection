import GlossaryPage from "@/components/pages/GlossaryPage";
import { alternates } from "@/lib/canonical";
import { glossaryText } from "@/lib/i18n/glossary";
export const metadata = {
  title: glossaryText("en").title,
  description: glossaryText("en").intro,
  alternates: alternates("/glossary"),
};
export default function Page() {
  return <GlossaryPage />;
}
