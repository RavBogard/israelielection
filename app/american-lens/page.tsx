import type { Metadata } from "next";
import ArticleShell from "@/components/article/ArticleShell";
import Body, { meta } from "@/content/american-lens.mdx";

export const metadata: Metadata = { title: meta.title, description: meta.dek };

export default function Page() {
  return <ArticleShell meta={meta} Body={Body} section={{ href: "/issues", title: "Issues" }} />;
}
