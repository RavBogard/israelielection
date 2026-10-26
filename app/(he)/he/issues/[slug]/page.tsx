import {referenceMetadata} from "@/lib/reference/metadata";
import ReferenceDocument from "@/components/reference/ReferenceDocument";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <ReferenceDocument lang="he" path={"/issues/"+slug}/>;}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return referenceMetadata("/issues/"+slug,"he");}
