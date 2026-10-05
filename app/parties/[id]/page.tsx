import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/components/interactives.css";
import ProfileDetail from "@/components/ProfileDetail";
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
    description: `${p.name} (${blocLabel[p.bloc]}), led by ${p.leader}: who they are, who votes for them, where they stand, and their polls.`,
  };
}

export default async function Page(props: PageProps<"/parties/[id]">) {
  const { id } = await props.params;
  const party = parties.find((p) => p.id === id);
  if (!party) notFound();
  return (
    <div className="ix">
      <div className="wrap">
        <div className="reading">
          <p className="toplink">
            <Link href={`/parties#${party.id}`}>Party Map</Link> and <Link href="/coalition-builder">Coalition Builder</Link>
          </p>
          <article style={{ paddingTop: 22 }}>
            <ProfileDetail party={party} />
          </article>
          <SourcesBox count={allPolls.length + 2} open>
            <PollSources />
            <ProfileSources />
          </SourcesBox>
        </div>
      </div>
    </div>
  );
}
