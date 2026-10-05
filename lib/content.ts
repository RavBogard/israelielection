import type { ComponentType } from "react";
import { COMMUNITIES, ISSUES, type ArticleMeta, type CommunitySlug, type IssueSlug } from "@/lib/articles";

type Mod = { default: ComponentType; meta: ArticleMeta };

// Literal prefixes so the bundler can see every MDX file.
export const loadIssue = (slug: IssueSlug): Promise<Mod> => import(`@/content/issues/${slug}.mdx`);
export const loadCommunity = (slug: CommunitySlug): Promise<Mod> => import(`@/content/communities/${slug}.mdx`);

export async function issueIndex() {
  return Promise.all(ISSUES.map(async (slug) => ({ slug, href: `/issues/${slug}`, meta: (await loadIssue(slug)).meta })));
}
export async function communityIndex() {
  return Promise.all(COMMUNITIES.map(async (slug) => ({ slug, href: `/communities/${slug}`, meta: (await loadCommunity(slug)).meta })));
}
