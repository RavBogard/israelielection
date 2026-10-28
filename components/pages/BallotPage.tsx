import BallotDirectory from "@/components/BallotDirectory";
import { ListSharesProvider } from "@/components/list-status/ListSharesProvider";
import PageHead from "@/components/PageHead";
import { ballotLabels } from "@/lib/ballot-locale";
import { listSharesForRender } from "@/lib/list-shares-server";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import type { Lang } from "@/lib/i18n";
export default async function BallotPage({ lang }: { lang: Lang }) {
  const t = partyDirectoryText(lang);
  const shares = await listSharesForRender();
  return (
    <div className="wrap">
      <PageHead title={`${t.roster}: 2026`} standfirst={t.rosterIntro} />
      <ListSharesProvider shares={shares}>
        <BallotDirectory lang={lang} labels={ballotLabels(lang)} />
      </ListSharesProvider>
    </div>
  );
}
