import MatchPage from "@/components/pages/MatchPage";
import { localizedAlternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("zh").title,
  description: matchText("zh").intro,
  alternates: localizedAlternates("/zh/match"),
};
export default function Page() {
  return <MatchPage lang="zh" />;
}
