import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("he").policies,alternates:localizedAlternates("/he/policies")};
export default async function Page(){return <ReferenceHub kind="policies" lang="he"/>;}
