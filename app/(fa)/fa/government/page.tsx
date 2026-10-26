import "@/lib/i18n/fa/register";
import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.fa.title,description:FORMATION.fa.intro,alternates:localizedAlternates("/fa/government")};
export default function Page(){return <GovernmentPage lang="fa"/>;}
