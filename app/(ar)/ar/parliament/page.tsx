import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("ar").parliament,alternates:localizedAlternates("/ar/parliament")};
export default async function Page(){return <ReferenceHub kind="parliament" lang="ar"/>;}
