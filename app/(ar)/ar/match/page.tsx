import MatchPage from "@/components/pages/MatchPage";
import { localizedAlternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("ar").title,
  description: matchText("ar").intro,
  alternates: localizedAlternates("/ar/match"),
};
export default function Page() {
  return <MatchPage lang="ar" />;
}
