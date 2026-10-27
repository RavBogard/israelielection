import BallotPage from "@/components/pages/BallotPage";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { alternates } from "@/lib/canonical";
export const metadata = {
  title: partyDirectoryText("en").roster,
  alternates: alternates("/ballot"),
};
export default function Page() {
  return <BallotPage lang="en" />;
}
