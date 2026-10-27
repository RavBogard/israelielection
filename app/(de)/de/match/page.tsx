import MatchPage from "@/components/pages/MatchPage";
import { localizedAlternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("de").title,
  description: matchText("de").intro,
  alternates: localizedAlternates("/de/match"),
};
export default function Page() {
  return <MatchPage lang="de" />;
}
