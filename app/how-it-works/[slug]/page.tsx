import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleShell from "@/components/article/ArticleShell";
import { GUIDES, type GuideSlug } from "@/lib/articles";
import { guideIndex, loadGuide } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((slug) => ({ slug }));
}

const known = (s: string): s is GuideSlug => (GUIDES as readonly string[]).includes(s);

export async function generateMetadata(props: PageProps<"/how-it-works/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  if (!known(slug)) return {};
  const { meta } = await loadGuide(slug);
  return { title: meta.title, description: meta.dek };
}

export default async function Page(props: PageProps<"/how-it-works/[slug]">) {
  const { slug } = await props.params;
  if (!known(slug)) notFound();
  const { default: Body, meta } = await loadGuide(slug);
  const siblings = (await guideIndex()).map((s) => ({ href: s.href, title: s.meta.title }));
  return <ArticleShell meta={meta} Body={Body} section={{ href: "/how-it-works", title: "How it works" }} siblings={siblings} current={`/how-it-works/${slug}`} />;
}
