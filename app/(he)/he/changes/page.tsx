import ReferenceHub from "@/components/reference/ReferenceHub";
import {referenceText} from "@/lib/i18n/reference";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:referenceText("he").changes,alternates:localizedAlternates("/he/changes")};
export default async function Page(){return <ReferenceHub kind="changes" lang="he"/>;}
