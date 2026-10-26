import {referenceMetadata} from "@/lib/reference/metadata";
import ReferenceDocument from "@/components/reference/ReferenceDocument";
export default async function Page(){return <ReferenceDocument lang="fr" path={"/about"}/>;}

export const metadata=referenceMetadata("/about","fr");
