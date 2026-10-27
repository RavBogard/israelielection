import BallotPage from "@/components/pages/BallotPage";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {
  title: partyDirectoryText("de").roster,
  alternates: localizedAlternates("/de/ballot"),
};
export default function Page() {
  return <BallotPage lang="de" />;
}
