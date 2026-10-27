import SearchPage from "@/components/search/SearchPage";
import {searchText} from "@/lib/i18n/search";
import {localizedAlternates} from "@/lib/canonical";
export const metadata={title:searchText("fr").title,description:searchText("fr").intro,alternates:localizedAlternates("/fr/search")};
export default function Page(){return <SearchPage lang="fr"/>;}
