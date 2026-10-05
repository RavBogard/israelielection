export type NavItem = { href: string; label: string };

/** The menu, grouped by what the reader is doing. "Teach it" stands apart for educators. */
export const NAV_GROUPS: readonly { label: string; items: readonly NavItem[] }[] = [
  {
    label: "Explore",
    items: [
      { href: "/", label: "Coalition Builder" },
      { href: "/parties", label: "Party Map" },
    ],
  },
  {
    label: "Follow",
    items: [
      { href: "/polls", label: "Polls" },
      { href: "/news", label: "News" },
      { href: "/results", label: "Results" },
    ],
  },
  {
    label: "Understand",
    items: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/issues", label: "Issues" },
      { href: "/communities", label: "Communities" },
      { href: "/vote-map", label: "Vote map" },
      { href: "/american-lens", label: "The American lens" },
    ],
  },
];

export const TEACH: NavItem = { href: "/teach", label: "Teach it" };

/** Every section in menu order, for pages that list them. */
export const NAV: readonly NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), TEACH];

/** The site's one-paragraph description, used in metadata and the footer. */
export const DESCRIPTION =
  "An English-language reference on Israel's October 27, 2026 election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced.";
