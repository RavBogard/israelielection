import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("zh").reference,alternates:localizedAlternates("/zh/reference")};
export default async function Page(){return <ReferenceHub kind="reference" lang="zh"/>;}
