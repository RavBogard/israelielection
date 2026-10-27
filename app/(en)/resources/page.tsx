import ResourcesPage from "@/components/pages/ResourcesPage";
import { alternates } from "@/lib/canonical";
import { resourcesText } from "@/lib/i18n/resources";
export const metadata = {
  title: resourcesText("en").title,
  description: resourcesText("en").intro,
  alternates: alternates("/resources"),
};
export default function Page() {
  return <ResourcesPage lang="en" />;
}
