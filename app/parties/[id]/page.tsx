import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/components/interactives.css";
import ProfileDetail from "@/components/ProfileDetail";
import { PollSources, ProfileSources } from "@/components/Sources";
import { blocLabel, dataUpdated, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";

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
      <div className="banner">Last updated {mediumDate(dataUpdated)}. Polls change daily.</div>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <p className="toplink">
          ← <Link href={`/parties#${party.id}`}>Party Map</Link> · <Link href="/coalition">Coalition Builder</Link>
        </p>
        <article style={{ paddingBlock: "24px 0" }}>
          <ProfileDetail party={party} />
        </article>
        <footer className="pagefoot">
          <h2>Sources</h2>
          <ol>
            <PollSources />
            <ProfileSources />
          </ol>
        </footer>
      </div>
    </div>
  );
}
