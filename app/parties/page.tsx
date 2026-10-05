import type { Metadata } from "next";
import Link from "next/link";
import PartyMap from "@/components/PartyMap";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { allPolls } from "@/lib/data";

// Hourly, so the election countdown in the masthead stays current.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Party Map",
  description: "Israel's 2026 parties sized by their average poll standing, with distinct shades grouped into editorial political families and a linked sourced profile of each.",
};

export default function Page() {
  return (
    <div className="ix">
      <div className="wrap">
        <PartyMap />
        <p><Link href="/party-history">Explore the party family tree</Link> · <Link href="/ballot">All 38 published ballot lists</Link></p>
        <SourcesBox count={allPolls.length + 5}>
          <PollSources />
          <li>
            <b>Averages</b> are our arithmetic from each pollster&apos;s latest current poll above, weighted by the square root of sample
            size, each party over the polls where it passed the threshold.
          </li>
          <ProfileSources />
          <li>
            <b>List count:</b> 38 lists approved, Ynet, Sep 27, 2026.
          </li>
        </SourcesBox>
      </div>
    </div>
  );
}
