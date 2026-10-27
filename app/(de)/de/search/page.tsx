import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:searchText("de").title,description:searchText("de").intro,alternates:localizedAlternates("/de/search")};
export default function Page(){return <SearchPage lang="de"/>;}
