import {referenceMetadata} from "@/lib/reference/metadata";
import ReferenceHub from "@/components/reference/ReferenceHub";
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;return referenceMetadata(`/issues/${id}`,"fr",`/policies/${id}`)}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ReferenceHub kind="policy" lang="fr" id={id}/>;}
