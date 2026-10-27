import ResourcesPage from "@/components/pages/ResourcesPage";
import { localizedAlternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("zh").title,
  description: resourcesText("zh").intro,
  alternates: localizedAlternates("/zh/resources"),
};
export default function Page() {
  return <ResourcesPage lang="zh" />;
}
