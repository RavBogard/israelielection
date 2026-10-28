import { liveElectionFigures } from "@/lib/timeline-live";
import TimelinePage from "@/components/pages/TimelinePage";
import { historicalMetadata } from "@/lib/history-pages";
export const metadata=historicalMetadata("timeline","he");
export default async function Page(){return <TimelinePage lang="he" live={await liveElectionFigures()}/>;}
