import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:searchText("zh").title,description:searchText("zh").intro,alternates:localizedAlternates("/zh/search")};
export default function Page(){return <SearchPage lang="zh"/>;}
