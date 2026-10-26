import "@/lib/i18n/fr/register";
import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.fr.title,description:FORMATION.fr.intro,alternates:localizedAlternates("/fr/government")};
export default function Page(){return <GovernmentPage lang="fr"/>;}
