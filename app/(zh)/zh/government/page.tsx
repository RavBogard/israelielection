import "@/lib/i18n/zh/register";
import GovernmentPage from "@/components/pages/GovernmentPage";
import { FORMATION } from "@/lib/i18n/formation-live";
import { localizedAlternates } from "@/lib/canonical";
export const metadata={title:FORMATION.zh.title,description:FORMATION.zh.intro,alternates:localizedAlternates("/zh/government")};
export default function Page(){return <GovernmentPage lang="zh"/>;}
