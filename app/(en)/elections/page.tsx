import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {alternates} from "@/lib/canonical";
export const metadata={title:referenceText("en").elections,alternates:alternates("/elections")};
export default async function Page(){return <ReferenceHub kind="elections" lang="en"/>;}
