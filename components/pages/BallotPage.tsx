import BallotDirectory from "@/components/BallotDirectory";
import PageHead from "@/components/PageHead";
import { ballotLabels } from "@/lib/ballot-locale";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import type { Lang } from "@/lib/i18n";
export default function BallotPage({ lang }: { lang: Lang }) {
  const t = partyDirectoryText(lang);
  return (
    <div className="wrap">
      <PageHead title={`${t.roster}: 2026`} standfirst={t.rosterIntro} />
      <BallotDirectory lang={lang} labels={ballotLabels(lang)} />
    </div>
  );
}
