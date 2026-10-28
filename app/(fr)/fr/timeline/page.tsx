import { liveElectionFigures } from "@/lib/timeline-live";
import TimelinePage from "@/components/pages/TimelinePage";
import { historicalMetadata } from "@/lib/history-pages";
export const metadata=historicalMetadata("timeline","fr");
export default async function Page(){return <TimelinePage lang="fr" live={await liveElectionFigures()}/>;}
