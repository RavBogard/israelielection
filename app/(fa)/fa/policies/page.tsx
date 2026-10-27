import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("fa").policies,alternates:localizedAlternates("/fa/policies")};
export default async function Page(){return <ReferenceHub kind="policies" lang="fa"/>;}
