import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:searchText("ar").title,description:searchText("ar").intro,alternates:localizedAlternates("/ar/search")};
export default function Page(){return <SearchPage lang="ar"/>;}
