import ResourcesPage from "@/components/pages/ResourcesPage";
import { localizedAlternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("ar").title,
  description: resourcesText("ar").intro,
  alternates: localizedAlternates("/ar/resources"),
};
export default function Page() {
  return <ResourcesPage lang="ar" />;
}
