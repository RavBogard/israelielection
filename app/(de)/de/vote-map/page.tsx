import VoteMapPage from "@/components/pages/VoteMapPage";
import { localizedAlternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("de").title,
  description: mapText("de").intro,
  alternates: localizedAlternates("/de/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="de" />;
}
