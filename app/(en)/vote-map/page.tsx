import VoteMapPage from "@/components/pages/VoteMapPage";
import { alternates } from "@/lib/canonical";
import { mapText } from "@/lib/i18n/vote-map";
export const metadata = {
  title: mapText("en").title,
  description: mapText("en").intro,
  alternates: alternates("/vote-map"),
};
export default function Page() {
  return <VoteMapPage lang="en" />;
}
