import MatchPage from "@/components/pages/MatchPage";
import { localizedAlternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("fr").title,
  description: matchText("fr").intro,
  alternates: localizedAlternates("/fr/match"),
};
export default function Page() {
  return <MatchPage lang="fr" />;
}
