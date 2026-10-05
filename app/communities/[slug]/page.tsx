import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleShell from "@/components/article/ArticleShell";
import { COMMUNITIES, type CommunitySlug } from "@/lib/articles";
import { loadCommunity, communityIndex } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMMUNITIES.map((slug) => ({ slug }));
}

const known = (s: string): s is CommunitySlug => (COMMUNITIES as readonly string[]).includes(s);

export async function generateMetadata(props: PageProps<"/communities/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  if (!known(slug)) return {};
  const { meta } = await loadCommunity(slug);
  return { title: meta.title, description: meta.dek };
}

export default async function Page(props: PageProps<"/communities/[slug]">) {
  const { slug } = await props.params;
  if (!known(slug)) notFound();
  const { default: Body, meta } = await loadCommunity(slug);
  const siblings = (await communityIndex()).map((s) => ({ href: s.href, title: s.meta.title }));
  return <ArticleShell meta={meta} Body={Body} section={{ href: "/communities", title: "Communities" }} siblings={siblings} current={`/communities/${slug}`} />;
}
