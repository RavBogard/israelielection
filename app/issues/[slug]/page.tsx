import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import { notFound } from "next/navigation";
import ArticleShell from "@/components/article/ArticleShell";
import { PositionsLead } from "@/components/article/Article";
import { ISSUES, type IssueSlug } from "@/lib/articles";
import { loadIssue, issueIndex } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return ISSUES.map((slug) => ({ slug }));
}

const known = (s: string): s is IssueSlug => (ISSUES as readonly string[]).includes(s);

export async function generateMetadata(props: PageProps<"/issues/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  if (!known(slug)) return {};
  const { meta } = await loadIssue(slug);
  return { title: meta.title, description: meta.dek, alternates: alternates(`/issues/${slug}`) };
}

export default async function Page(props: PageProps<"/issues/[slug]">) {
  const { slug } = await props.params;
  if (!known(slug)) notFound();
  const { default: Body, meta } = await loadIssue(slug);
  const siblings = (await issueIndex()).map((s) => ({ href: s.href, title: s.meta.title }));
  return <ArticleShell meta={meta} Body={Body} section={{ href: "/issues", title: "Issues" }} siblings={siblings} current={`/issues/${slug}`} lead={<PositionsLead issue={slug} />} />;
}
