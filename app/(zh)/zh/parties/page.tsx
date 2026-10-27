import PartiesIndexPage from "@/components/pages/PartiesIndexPage";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { localizedAlternates } from "@/lib/canonical";
export const metadata = {
  title: partyDirectoryText("zh").map,
  alternates: localizedAlternates("/zh/parties"),
};
export default function Page() {
  return <PartiesIndexPage lang="zh" />;
}
