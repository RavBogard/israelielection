import VoteMapPage from "@/components/pages/VoteMapPage";
import { localizedAlternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("fa").title,
  description: mapText("fa").intro,
  alternates: localizedAlternates("/fa/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="fa" />;
}
