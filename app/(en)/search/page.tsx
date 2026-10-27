import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {alternates} from "@/lib/canonical";
export const metadata={title:searchText("en").title,description:searchText("en").intro,alternates:alternates("/search")};
export default function Page(){return <SearchPage lang="en"/>;}
