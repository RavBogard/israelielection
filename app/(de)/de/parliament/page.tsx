import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("de").parliament,alternates:localizedAlternates("/de/parliament")};
export default async function Page(){return <ReferenceHub kind="parliament" lang="de"/>;}
