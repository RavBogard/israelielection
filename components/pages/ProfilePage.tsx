import { seatContextForRender } from "@/lib/seat-context-server";
import Link from "next/link";
import "@/components/interactives.css";
import PartyProfile from "@/components/PartyProfile";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { allPolls } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import profileText from "@/lib/i18n/profile";
import type { Party } from "@/lib/types";

/**
 * A party profile page (/parties/[id], /he/parties/[id]): the spread, then its sources. The Hebrew sources box
 * points to the Hebrew polls page for the poll-by-poll list rather than repeating it here.
 */
export default async function ProfilePage({ party, lang }: { party: Party; lang: Lang }) {
  const context = await seatContextForRender();
  const S = profileText[lang].sources;
  return (
    <div className="ix">
      <PartyProfile party={party} lang={lang} context={context} unavailable={!context} />
      <div className="wrap">
        {lang === "en" ? (
          <SourcesBox count={allPolls.length + 2}>
            <PollSources />
            <ProfileSources />
          </SourcesBox>
        ) : (
          <SourcesBox count={3} lang={lang}>
            <li>
              <b>{S.polls}:</b> <Link href={`/${lang}/polls`}>{S.pollsLine}</Link>
            </li>
            <li>{S.profiles}</li>
            <li>{S.bios}</li>
          </SourcesBox>
        )}
      </div>
    </div>
  );
}
