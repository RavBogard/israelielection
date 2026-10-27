import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("zh").elections,alternates:localizedAlternates("/zh/elections")};
export default async function Page(){return <ReferenceHub kind="elections" lang="zh"/>;}
