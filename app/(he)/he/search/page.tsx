import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:searchText("he").title,description:searchText("he").intro,alternates:localizedAlternates("/he/search")};
export default function Page(){return <SearchPage lang="he"/>;}
