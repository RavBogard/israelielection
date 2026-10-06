import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { heAlternates } from "@/lib/canonical";
import ProfilePage from "@/components/pages/ProfilePage";
import { blocLabel, parties } from "@/lib/data";
import { blocText, partyText } from "@/lib/i18n/overlays";
import profileText from "@/lib/i18n/profile";

export const revalidate = 3600;

export const dynamicParams = false;

export function generateStaticParams() {
  return parties.map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: PageProps<"/he/parties/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const p = parties.find((x) => x.id === id);
  if (!p) return {};
  const name = partyText(p, "name", "he").text;
  const bloc = blocText({ id: p.bloc, label: blocLabel[p.bloc] }, "he").text;
  return { title: name, alternates: heAlternates(`/he/parties/${p.id}`), description: profileText.he.meta.description(name, bloc, partyText(p, "leader", "he").text) };
}

export default async function Page(props: PageProps<"/he/parties/[id]">) {
  const { id } = await props.params;
  const party = parties.find((p) => p.id === id);
  if (!party) notFound();
  return <ProfilePage party={party} lang="he" />;
}
