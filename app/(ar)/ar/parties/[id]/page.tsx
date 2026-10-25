// Loads the Hebrew interface words before this module reads them (lib/i18n/he-text.ts).
import "@/lib/i18n/ar/register";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedAlternates } from "@/lib/canonical";
import ProfilePage from "@/components/pages/ProfilePage";
import { blocLabel, parties } from "@/lib/data";
import { blocText, partyText } from "@/lib/i18n/overlays";
import profileText from "@/lib/i18n/profile";

export const revalidate = 3600;

export const dynamicParams = false;

export function generateStaticParams() {
  return parties.map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const p = parties.find((x) => x.id === id);
  if (!p) return {};
  const name = partyText(p, "name", "ar").text;
  const bloc = blocText({ id: p.bloc, label: blocLabel[p.bloc] }, "ar").text;
  return { title: name, alternates: localizedAlternates(`/ar/parties/${p.id}`), description: profileText.ar.meta.description(name, bloc, partyText(p, "leader", "ar").text) };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const party = parties.find((p) => p.id === id);
  if (!party) notFound();
  return <ProfilePage party={party} lang="ar" />;
}
