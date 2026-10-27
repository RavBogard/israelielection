import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:searchText("fa").title,description:searchText("fa").intro,alternates:localizedAlternates("/fa/search")};
export default function Page(){return <SearchPage lang="fa"/>;}
