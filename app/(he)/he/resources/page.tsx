import ResourcesPage from "@/components/pages/ResourcesPage";
import { localizedAlternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("he").title,
  description: resourcesText("he").intro,
  alternates: localizedAlternates("/he/resources"),
};
export default function Page() {
  return <ResourcesPage lang="he" />;
}
