import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternates } from "@/lib/canonical";
import ProfilePage from "@/components/pages/ProfilePage";
import { blocLabel, parties } from "@/lib/data";
import profileText from "@/lib/i18n/profile";

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
  return { title: p.name, alternates: alternates(`/parties/${p.id}`), description: profileText.en.meta.description(p.name, blocLabel[p.bloc], p.leader) };
}

export default async function Page(props: PageProps<"/parties/[id]">) {
  const { id } = await props.params;
  const party = parties.find((p) => p.id === id);
  if (!party) notFound();
  return <ProfilePage party={party} lang="en" />;
}
