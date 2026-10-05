import Banner from "@/components/Banner";
import type { Metadata } from "next";
import Link from "next/link";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import { PollSources, ProfileSources } from "@/components/Sources";

// Hourly, so the election countdown in the banner stays current.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026: Build a Coalition" },
  description: "Pick a poll, add parties, and see whether they reach 61 of the Knesset's 120 seats, with each party's recorded coalition pledges.",
};

export default function Page() {
  return (
    <div className="ix">
      <Banner />
      <div className="wrap">
        <p className="toplink">
          Full map of the parties → <Link href="/parties">Party Map</Link>
        </p>
        <CoalitionBuilder />
        <footer className="pagefoot">
          <h2>Sources</h2>
          <ol>
            <PollSources />
            <li>
              <b>Blue and White</b> below threshold in all polls; Gantz will drop out in the last week if not crossing: Times of Israel,
              Sep 20, 2026.
            </li>
            <li>
              <b>Pledges.</b> Zionist opposition to govern without Arab parties: Haaretz, Oct 1, 2026 (headline). B&apos;Yachad &ldquo;only
              rely on Zionist parties&rdquo;: Times of Israel, Apr 26, 2026; no Arab or Haredi parties: Times of Israel, May 27, 2026. Joint
              List won&apos;t join Netanyahu: Times of Israel, Aug 19, 2026. Eisenkot on Ra&apos;am (&ldquo;he won&apos;t be part of my next
              government&rdquo;): Times of Israel, Sep 26, 2026. Lieberman, &ldquo;not for the Arab parties and not for the haredi
              parties&rdquo;: Jerusalem Post, Sep 21, 2025, repeated Oct 3, 2026. UTJ condition (Yaakov Asher): Matzav, Sep 28, 2026.
            </li>
            <li>
              <b>Surplus-vote agreements.</b> Yashar–Democrats and B&apos;Yachad–Yisrael Beiteinu signed Sep 10, 2026 (Times of Israel).
              Likud–Religious Zionism agreed Sep 8 (Israel Hayom), reported unsigned Sep 15 (Channel 14); final status not found. Joint
              List–Ra&apos;am: Ynet, Sep 11, and Jerusalem Post, Sep 13, 2026. Shas–UTJ &ldquo;expected&rdquo;: Jerusalem Post, Sep 10,
              2026; signing not found. Otzma, People of Israel and Reservists: no partner found (an IPF listing of Reservists with Yisrael
              Beiteinu is unconfirmed, since Yisrael Beiteinu signed with B&apos;Yachad).
            </li>
            <li>
              <b>Lists.</b> UTJ order (Asher 1, Goldknopf 2, Porush 4): Davar and Israel Hayom, Sep 8, 2026. Ra&apos;am no. 2 Yoav
              Segalovitz: Jerusalem Post and Times of Israel, Aug 31, 2026. B&apos;Yachad (Yesh Atid runs inside the list, Lapid no. 2):
              Times of Israel, Sep 6, 2026; deal signed Apr 25–26, 2026 (Jerusalem Post).
            </li>
            <li>
              <b>Disqualification and court ruling:</b> Central Elections Committee vote Sep 23, 2026 (Times of Israel); Supreme Court
              ruling Oct 2, 2026, hearing Oct 1 (Jerusalem Post; Al Jazeera, Oct 2, 2026).
            </li>
            <li>
              <b>Bloc labels and leaders:</b> Israel Policy Forum 120 Project, updated Sep 24, 2026; Jerusalem Post Sep 7, 2026; Times of
              Israel Aug 19 and Sep 6, 2026. Reservists–Economic&apos;s bloc is disputed (IsraelEd: would join Netanyahu; IPF: &ldquo;third
              bloc&rdquo;; ToI: non-aligned), so it is shown between the blocs.
            </li>
            <ProfileSources />
            <li>
              <b>61-seat majority:</b> Israel Democracy Institute, Apr 15, 2026.
            </li>
          </ol>
        </footer>
      </div>
    </div>
  );
}
