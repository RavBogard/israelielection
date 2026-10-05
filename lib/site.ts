export type NavItem = { href: string; label: string };

/**
 * The menu, grouped by what the reader is doing. "Teaching resources" stands apart for educators.
 * `items` sit in the masthead, which holds about eleven links; `more` are the group's further
 * pages, listed on the home index and in the footer but not in the masthead.
 */
export const NAV_GROUPS: readonly { label: string; items: readonly NavItem[]; more?: readonly NavItem[] }[] = [
  {
    label: "Explore",
    items: [
      { href: "/coalition-builder", label: "Coalition Builder" },
      { href: "/parties", label: "Party Map" },
    ],
    more: [{ href: "/compare", label: "Compare the parties" }],
  },
  {
    label: "Follow",
    items: [
      { href: "/polls", label: "Polls" },
      { href: "/news", label: "News" },
      { href: "/results", label: "Results" },
      { href: "/government", label: "Government" },
    ],
  },
  {
    label: "Understand",
    items: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/issues", label: "Issues" },
      { href: "/communities", label: "Communities" },
      { href: "/american-lens", label: "The American lens" },
    ],
    more: [
      { href: "/vote-map", label: "Vote map" },
      { href: "/timeline", label: "Timeline" },
      { href: "/glossary", label: "Glossary" },
    ],
  },
];

export const TEACH: NavItem = { href: "/teach", label: "Teaching resources" };

/** Every section in menu order, for pages that list them. */
export const NAV: readonly NavItem[] = [...NAV_GROUPS.flatMap((g) => [...g.items, ...(g.more ?? [])]), TEACH];

/** The site's one-paragraph description, used in metadata and the footer. */
export const DESCRIPTION =
  "An English-language reference on Israel's October 27, 2026 election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced.";
