import ResourcesPage from "@/components/pages/ResourcesPage";
import { localizedAlternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("fr").title,
  description: resourcesText("fr").intro,
  alternates: localizedAlternates("/fr/resources"),
};
export default function Page() {
  return <ResourcesPage lang="fr" />;
}
