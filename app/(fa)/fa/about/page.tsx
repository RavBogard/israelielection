import {referenceMetadata} from "@/lib/reference/metadata";
import ReferenceDocument from "@/components/reference/ReferenceDocument";
export default async function Page(){return <ReferenceDocument lang="fa" path={"/about"}/>;}

export const metadata=referenceMetadata("/about","fa");
