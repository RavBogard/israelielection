import type { Metadata } from "next";
import Link from "next/link";
import "@/components/article/article.css";
import VoteMap from "@/components/VoteMap";

export const metadata: Metadata = {
  title: "Vote map",
  description: "How Israel's cities, towns, kibbutzim and villages voted in the five Knesset elections from April 2019 to November 2022, from the Central Elections Committee's results by locality.",
};

const CEC = "https://votes25.bechirot.gov.il/nationalresults";
const TOI_VOTE = "https://www.timesofisrael.com/israel-goes-to-the-polls-on-tuesday-heres-how-to-cast-your-ballot/";
const TOI_EJ = "https://www.timesofisrael.com/unprecedented-1200-east-jerusalem-palestinians-got-israeli-citizenship-in-2019/";

export default function Page() {
  return (
    <div className="wrap article-page vote-map-page">
      <header className="page-head">
        <h1>Vote map</h1>
        <p className="standfirst">
          How each of Israel&apos;s roughly 1,200 voting localities voted in the five Knesset elections from April 2019 to November 2022. Pick an
          election, then explore one list&apos;s share in blue, the local leading list in color, or each town&apos;s vote mix in proportional pie markers.
        </p>
        <p className="note">Facts checked October 5, 2026. Results are the Central Elections Committee&apos;s final files for each election.</p>
      </header>

      <VoteMap />

      <div className="article-grid solo">
        <article className="article vm-text">
          <div className="body">
            <h2>Reading the map</h2>
            <p><strong>Three views of the same votes.</strong> In the single-list view, darker blue means a higher share of valid votes. Leading-list colors show local plurality, which can be below 50%; ties are marked separately. If the combined Other lists could conceal a leader, the map leaves the leader unestablished. Pie slices show the named lists and Other, with circle area proportional to valid votes. Overlapping markers are filtered in place, with a displayed coverage count; zoom or search for any town to see its full recorded breakdown. Geography is not voter movement, and land area is not vote count.</p>
            <p>
              <strong>A town is not a group.</strong> The map shows how places voted, not how any community voted. Mixed cities such as Haifa, Lod
              and Akko are one number each: the committee publishes results by polling station, but no current public list of station addresses was
              found, so a city cannot be split into neighborhoods. The pages on <Link href="/communities">communities</Link> use the same files with
              the same caution.
            </p>
            <p>
              <strong>Up to one vote in ten is not on the map.</strong> Votes cast away from the voter&apos;s home polling station, at special stations
              for soldiers, hospital patients and residents of care facilities among others, are counted in one national pseudo-locality. They were
              5.5% of valid votes in April 2019 and 9.6% in November 2022 (computed from the committee&apos;s locality files). These ballots go in two
              envelopes, which attach the voter&apos;s name so it can be checked against the roll to prevent voting twice (
              <a href={TOI_VOTE}>Times of Israel, Oct 30, 2022</a>). The bars beside the map keep these votes separate from locality votes: a chosen list&apos;s shares in single-list view, or the full named-list mix and Other in the two multi-list views.
            </p>
            <p>
              <strong>Each list is shown as it ran that year.</strong> Ballot letters and alliances change between elections. In 2022, for example,
              Religious Zionism ran on one list with Otzma Yehudit, and the letters פה belonged to Blue and White in 2019–2020 and to Yesh Atid in
              2021–2022. The list menu names every list that won at least 1% of the national vote; smaller lists are counted in the totals but cannot
              be picked individually. Their combined remainder appears as Other in vote-mix markers and the town breakdown. Colors identify original historical list names, not current political blocs. <Link href="/party-history">Trace changing lists and alliances</Link>.
            </p>

            <h2>The West Bank and East Jerusalem</h2>
            <p>
              Israeli citizens aged 18 and over on election day may vote (<a href={TOI_VOTE}>Times of Israel, Oct 30, 2022</a>). Israeli citizens who
              live in West Bank settlements vote in their own localities, so settlements appear in the committee&apos;s files and are drawn like any
              other locality. The committee&apos;s files have no Palestinian localities in the West Bank, so the rest of the West Bank is blank, and
              Gaza is shown for reference only. The dashed line is the outline of the West Bank, including East Jerusalem, in the UN Office for the
              Coordination of Humanitarian Affairs&apos; boundary file.
            </p>
            <p>
              Jerusalem is one locality, East and West. More than 350,000 Palestinian residents of East Jerusalem hold permanent residency rather than
              citizenship; they can vote in municipal elections but not in national ones (<a href={TOI_EJ}>Times of Israel, Jan 13, 2020</a>).
            </p>

            <h2>Sources and method</h2>
            <ul>
              <li>
                <strong>Results:</strong> the Central Elections Committee&apos;s results by locality for each election (the files are linked under the
                map). For every list in all five elections, the locality figures add up exactly to the committee&apos;s{" "}
                <a href={CEC}>national results</a>; the build script checks this each time it runs.
              </li>
              <li>
                <strong>Boundaries:</strong> the Ministry of Transport&apos;s 2026 locality layer on data.gov.il, and, for localities it lacks (mostly
                West Bank settlements, which it leaves out), the Central Bureau of Statistics&apos; 2008 census layer. About 35 localities with no
                boundary in either, mostly Bedouin tribes in the Negev, along with army camps and a few newer localities, are drawn as dots at the
                bureau&apos;s point for them. They held 0.48% of valid votes in 2022. The locality listed as Hebron (215 valid votes in 2022) has
                neither a boundary nor a point; it can be found with the town search but is not drawn on the map.
              </li>
              <li>
                <strong>Names:</strong> the Central Bureau of Statistics&apos; English names, with this site&apos;s spellings for the best-known places
                (Bnei Brak, Beersheba, Petah Tikva, Modi&apos;in Illit).
              </li>
              <li>
                <strong>West Bank outline and Gaza:</strong>{" "}
                <a href="https://data.humdata.org/dataset/cod-ab-pse">OCHA, State of Palestine subnational administrative boundaries</a>, published on
                the Humanitarian Data Exchange under CC BY-IGO.
              </li>
              <li>
                <strong>Precedent:</strong> the open-source project{" "}
                <a href="https://github.com/IdanTravitsky/israel-votes">IdanTravitsky/israel-votes</a> maps the same committee results from 1996 on
                and handles envelope votes the same way. No code or data was taken from it.
              </li>
            </ul>
            <p>The 2026 results will be added once the committee posts its final file, expected about a week after the October 27 vote, as in 2022.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
