import BallotPage from "@/components/pages/BallotPage";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {
  title: partyDirectoryText("fa").roster,
  alternates: localizedAlternates("/fa/ballot"),
};
export default function Page() {
  return <BallotPage lang="fa" />;
}
