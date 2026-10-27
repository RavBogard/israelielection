import VoteMapPage from "@/components/pages/VoteMapPage";
import { localizedAlternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("ar").title,
  description: mapText("ar").intro,
  alternates: localizedAlternates("/ar/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="ar" />;
}
