import {referenceMetadata} from "@/lib/reference/metadata";
import ReferenceDocument from "@/components/reference/ReferenceDocument";
export default async function Page(){return <ReferenceDocument lang="de" path={"/american-lens"}/>;}

export const metadata=referenceMetadata("/american-lens","de");
