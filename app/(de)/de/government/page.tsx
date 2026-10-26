import "@/lib/i18n/de/register";
import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.de.title,description:FORMATION.de.intro,alternates:localizedAlternates("/de/government")};
export default function Page(){return <GovernmentPage lang="de"/>;}
