import PartiesIndexPage from "@/components/pages/PartiesIndexPage";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {
  title: partyDirectoryText("fr").map,
  alternates: localizedAlternates("/fr/parties"),
};
export default function Page() {
  return <PartiesIndexPage lang="fr" />;
}
