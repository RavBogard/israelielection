import "@/lib/i18n/ar/register";
import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.ar.title,description:FORMATION.ar.intro,alternates:localizedAlternates("/ar/government")};
export default function Page(){return <GovernmentPage lang="ar"/>;}
