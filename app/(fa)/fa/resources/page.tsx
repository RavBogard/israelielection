import ResourcesPage from "@/components/pages/ResourcesPage";
import { localizedAlternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("fa").title,
  description: resourcesText("fa").intro,
  alternates: localizedAlternates("/fa/resources"),
};
export default function Page() {
  return <ResourcesPage lang="fa" />;
}
