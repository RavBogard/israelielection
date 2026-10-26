import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.en.title,description:FORMATION.en.intro,alternates:localizedAlternates("/government")};
export default function Page(){return <GovernmentPage lang="en"/>;}
