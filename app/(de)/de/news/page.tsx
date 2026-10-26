import BriefingPage from "@/components/reference/BriefingPage";
import {briefingMetadata} from "@/components/reference/briefing-metadata";
export const metadata=briefingMetadata("de");
export default async function Page(){return <BriefingPage lang="de"/>;}