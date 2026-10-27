import MatchPage from "@/components/pages/MatchPage";
import { alternates } from "@/lib/canonical";
import { matchText } from "@/lib/i18n/match";
export const metadata = {
  title: matchText("en").title,
  description: matchText("en").intro,
  alternates: alternates("/match"),
};
export default function Page() {
  return <MatchPage />;
}
