import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;return {title:referenceText("he").elections,alternates:localizedAlternates(`/he/elections/${id}`)}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ReferenceHub kind="edition" lang="he" id={id}/>;}
