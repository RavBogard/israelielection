import PartyHistoryPage from "@/components/pages/PartyHistoryPage";
import { historicalMetadata } from "@/lib/history-pages";
export const metadata=historicalMetadata("party-history","fr");
export default function Page(){return <PartyHistoryPage lang="fr"/>;}
