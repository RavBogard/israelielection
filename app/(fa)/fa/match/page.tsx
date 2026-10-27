import MatchPage from "@/components/pages/MatchPage";
import { localizedAlternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("fa").title,
  description: matchText("fa").intro,
  alternates: localizedAlternates("/fa/match"),
};
export default function Page() {
  return <MatchPage lang="fa" />;
}
