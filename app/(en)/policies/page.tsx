import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {alternates} from "@/lib/canonical";
export const metadata={title:referenceText("en").policies,alternates:alternates("/policies")};
export default async function Page(){return <ReferenceHub kind="policies" lang="en"/>;}
