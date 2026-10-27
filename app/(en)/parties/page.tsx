import PartiesIndexPage from "@/components/pages/PartiesIndexPage";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { alternates } from "@/lib/canonical";
export const metadata = {
  title: partyDirectoryText("en").map,
  alternates: alternates("/parties"),
};
export default function Page() {
  return <PartiesIndexPage lang="en" />;
}
