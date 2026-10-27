import TimelinePage from "@/components/pages/TimelinePage";
import { historicalMetadata } from "@/lib/history-pages";
export const metadata=historicalMetadata("timeline","he");
export default function Page(){return <TimelinePage lang="he"/>;}
