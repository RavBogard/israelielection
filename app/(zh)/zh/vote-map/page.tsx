import VoteMapPage from "@/components/pages/VoteMapPage";
import { localizedAlternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("zh").title,
  description: mapText("zh").intro,
  alternates: localizedAlternates("/zh/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="zh" />;
}
