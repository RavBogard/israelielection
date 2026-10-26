import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {alternates} from "@/lib/canonical";
export const metadata={title:referenceText("en").parliament,alternates:alternates("/parliament")};
export default async function Page(){return <ReferenceHub kind="parliament" lang="en"/>;}
