import PartyHistoryPage from "@/components/pages/PartyHistoryPage";
import { historicalMetadata } from "@/lib/history-pages";
export const metadata=historicalMetadata("party-history","de");
export default function Page(){return <PartyHistoryPage lang="de"/>;}
