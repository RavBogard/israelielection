import "@/lib/i18n/he/register";
import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.he.title,description:FORMATION.he.intro,alternates:localizedAlternates("/he/government")};
export default function Page(){return <GovernmentPage lang="he"/>;}
