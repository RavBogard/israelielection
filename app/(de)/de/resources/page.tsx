import ResourcesPage from "@/components/pages/ResourcesPage";
import { localizedAlternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("de").title,
  description: resourcesText("de").intro,
  alternates: localizedAlternates("/de/resources"),
};
export default function Page() {
  return <ResourcesPage lang="de" />;
}
