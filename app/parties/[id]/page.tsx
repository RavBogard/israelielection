import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/components/interactives.css";
import PartyProfile from "@/components/PartyProfile";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { allPolls, blocLabel, parties } from "@/lib/data";

// Hourly, so the election countdown in the masthead stays current.
export const revalidate = 3600;

export const dynamicParams = false;

export function generateStaticParams() {
  return parties.map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: PageProps<"/parties/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const p = parties.find((x) => x.id === id);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.name} (${blocLabel[p.bloc]}), led by ${p.leader}: its polls, its voters, where it stands on seven issues, and its people, every number dated and sourced.`,
  };
}

export default async function Page(props: PageProps<"/parties/[id]">) {
  const { id } = await props.params;
  const party = parties.find((p) => p.id === id);
  if (!party) notFound();
  return (
    <div className="ix">
      <PartyProfile party={party} />
      <div className="wrap">
        <SourcesBox count={allPolls.length + 2}>
          <PollSources />
          <ProfileSources />
        </SourcesBox>
      </div>
    </div>
  );
}
