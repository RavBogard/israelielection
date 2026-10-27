import MatchPage from "@/components/pages/MatchPage";
import { localizedAlternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("he").title,
  description: matchText("he").intro,
  alternates: localizedAlternates("/he/match"),
};
export default function Page() {
  return <MatchPage lang="he" />;
}
