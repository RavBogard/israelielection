import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import BallotDirectory from "@/components/BallotDirectory";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = { title: "All 38 published ballot lists", description: "All 38 lists in the Central Elections Committee's published 2026 submitted roster: English names, original Hebrew, letters and official candidate links, with publication status.", alternates: alternates("/ballot") };

export default function Page() {
  return (
    <div className="wrap">
      <PageHead title="The ballot directory" standfirst="Every list on the published roster, far more than the polls count, with its official name and source." />
      <BallotDirectory />
    </div>
  );
}
