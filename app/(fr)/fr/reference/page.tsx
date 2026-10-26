import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("fr").reference,alternates:localizedAlternates("/fr/reference")};
export default async function Page(){return <ReferenceHub kind="reference" lang="fr"/>;}
