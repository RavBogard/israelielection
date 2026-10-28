import Link from "next/link";
import PartyMap from "@/components/PartyMap";
import { ListSharesProvider } from "@/components/list-status/ListSharesProvider";
import { listSharesForRender } from "@/lib/list-shares-server";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { allPolls } from "@/lib/data";
import { editionPath, type Lang } from "@/lib/i18n";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import chrome from "@/lib/i18n/chrome";
export default async function PartiesIndexPage({ lang }: { lang: Lang }) {
  const t = partyDirectoryText(lang);
  const shares = await listSharesForRender();
  return (
    <div className="ix">
      <div className="wrap">
        <ListSharesProvider shares={shares}>
          <PartyMap />
        </ListSharesProvider>
        <p>
          <Link href="/party-history" hrefLang="en">
            {t.familyTree}
            {lang !== "en" && ` ${chrome[lang].inEnglish}`}
          </Link>
          .{" "}
          <Link href={editionPath("/ballot", lang) ?? "/ballot"}>
            {t.roster}: 2026
          </Link>
          .
        </p>
        {lang !== "en" ? (
          <p>
            {t.sourceNotice}{" "}
            <Link href="/parties?original=en" hrefLang="en">
              {t.original}
            </Link>
            .
          </p>
        ) : (
          <SourcesBox count={allPolls.length + 5}>
            <PollSources />
            <li>
              <b>Campaign comparison:</b> Polling averages are our arithmetic
              from each pollster’s latest current poll above, weighted by the
              square root of sample size, each party over the polls where it
              passed the threshold.
            </li>
            <ProfileSources />
            <li>
              <b>List count:</b>Historical reporting: Ynet, September 27, 2026.
              The saved CEC roster and its publication caveats are retained in
              the ballot directory.
            </li>
          </SourcesBox>
        )}
      </div>
    </div>
  );
}
