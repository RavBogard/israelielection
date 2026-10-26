import BriefingPage from "@/components/reference/BriefingPage";
import {briefingMetadata} from "@/components/reference/briefing-metadata";
export async function generateMetadata({params}:{params:Promise<{date:string}>}){return briefingMetadata("he",(await params).date);}
export default async function Page({params}:{params:Promise<{date:string}>}){const {date}=await params;return <BriefingPage lang="he" date={date}/>;}