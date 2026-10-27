import VoteMapPage from "@/components/pages/VoteMapPage";
import { localizedAlternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("fr").title,
  description: mapText("fr").intro,
  alternates: localizedAlternates("/fr/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="fr" />;
}
