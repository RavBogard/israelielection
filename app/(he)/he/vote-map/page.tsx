import VoteMapPage from "@/components/pages/VoteMapPage";
import { localizedAlternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("he").title,
  description: mapText("he").intro,
  alternates: localizedAlternates("/he/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="he" />;
}
