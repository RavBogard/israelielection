import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("de").elections,alternates:localizedAlternates("/de/elections")};
export default async function Page(){return <ReferenceHub kind="elections" lang="de"/>;}
