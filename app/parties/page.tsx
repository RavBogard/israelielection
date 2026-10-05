import type { Metadata } from "next";
import PartyMap from "@/components/PartyMap";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { allPolls } from "@/lib/data";

// Hourly, so the election countdown in the masthead stays current.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Party Map",
  description: "Israel's 2026 parties sized by their average poll standing, grouped by bloc, with a sourced profile of each.",
};

export default function Page() {
  return (
    <div className="ix">
      <div className="wrap">
        <PartyMap />
        <SourcesBox count={allPolls.length + 5}>
          <PollSources />
          <li>
            <b>Averages</b> are our arithmetic from each pollster&apos;s latest current poll above, weighted by the square root of sample
            size, each party over the polls where it passed the threshold.
          </li>
          <ProfileSources />
          <li>
            <b>Corrections applied Oct 4:</b> the Central Elections Committee voted Sep 23 (reported Sep 24); the Supreme Court heard the appeals
            Oct 1 and ruled Oct 2. UTJ&apos;s list head is Yaakov Asher. Ra&apos;am&apos;s no. 2 is Yoav Segalovitz. Yesh Atid runs inside
            B&apos;Yachad, with Lapid no. 2.
          </li>
          <li>
            <b>List count:</b> 38 lists approved, Ynet, Sep 27, 2026.
          </li>
        </SourcesBox>
      </div>
    </div>
  );
}
