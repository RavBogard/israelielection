import { liveElectionFigures } from "@/lib/timeline-live";
import TimelinePage from "@/components/pages/TimelinePage";
import { historicalMetadata } from "@/lib/history-pages";
export const metadata=historicalMetadata("timeline","ar");
export default async function Page(){return <TimelinePage lang="ar" live={await liveElectionFigures()}/>;}
