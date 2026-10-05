import type { Metadata } from "next";
import Link from "next/link";
import PartyMap from "@/components/PartyMap";
import { PollSources, ProfileSources } from "@/components/Sources";
import { dataUpdated, otherPolls } from "@/lib/data";
import { mediumDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Party Map",
  description: "Israel's 2026 parties sized by their average poll standing, grouped by bloc, with a sourced profile of each.",
};

export default function Page() {
  return (
    <div className="ix">
      <div className="banner">Last updated {mediumDate(dataUpdated)}. Polls change daily.</div>
      <div className="wrap">
        <p className="toplink">
          Try building a government → <Link href="/coalition">Coalition Builder</Link>
        </p>
        <PartyMap />
        <footer className="pagefoot">
          <h2>Sources</h2>
          <ol>
            <PollSources />
            <li>
              <b>Averages</b> are our arithmetic from the averaged polls above
              {otherPolls.length ? ` (${otherPolls.map((p) => p.pollster).join(", ")} excluded)` : ""}.
            </li>
            <ProfileSources />
            <li>
              <b>Corrections applied Oct 4:</b> the Central Elections Committee voted Sep 23 (reported Sep 24); the Supreme Court heard the
              appeals Oct 1 and ruled Oct 2. UTJ&apos;s list head is Yaakov Asher. Ra&apos;am&apos;s no. 2 is Yoav Segalovitz. Yesh Atid
              runs inside B&apos;Yachad, with Lapid no. 2.
            </li>
            <li>
              <b>List count:</b> 38 lists approved, Ynet, Sep 27, 2026.
            </li>
          </ol>
        </footer>
      </div>
    </div>
  );
}
