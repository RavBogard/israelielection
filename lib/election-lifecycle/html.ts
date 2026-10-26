export const textOf = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, code: string) => {
      const n =
        code[0].toLowerCase() === "x"
          ? parseInt(code.slice(1), 16)
          : Number(code);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    })
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export function htmlTables(html: string) {
  return [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((t) =>
    [...t[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) =>
      [...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
        textOf(c[1]),
      ),
    ),
  );
}
export function isTestEnvironment(html: string) {
  return /סביבת\s*(?:בדיקות|ניסוי)|test\s*(?:environment|data)|testing\s*environment/i.test(
    textOf(html),
  );
}
export function linksOf(html: string, base: string) {
  return [
    ...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi),
  ].flatMap((m) => {
    try {
      return [
        {
          url: new URL(m[1].replace(/&amp;/g, "&"), base).href,
          title: textOf(m[2]),
        },
      ];
    } catch {
      return [];
    }
  });
}
/** Balanced same-tag extraction handles nested WordPress/Elementor content without truncating at the first div. */
export function elementBlocks(
  html: string,
  tag: string,
  accept: (open: string) => boolean = () => true,
) {
  const stack: { start: number; accepted: boolean }[] = [],
    out: { html: string; open: string; start: number }[] = [];
  const expression = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  for (const m of html.matchAll(expression)) {
    if (m[0].startsWith("</")) {
      const open = stack.pop();
      if (open?.accepted)
        out.push({
          html: html.slice(open.start, m.index! + m[0].length),
          open: html.slice(open.start, html.indexOf(">", open.start) + 1),
          start: open.start,
        });
    } else if (!m[0].endsWith("/>"))
      stack.push({ start: m.index!, accepted: accept(m[0]) });
  }
  return out.sort((a, b) => a.start - b.start);
}
const classHas = (open: string, name: string) =>
  new RegExp(`class=["'][^"']*\\b${name}\\b`).test(open);
function dateOf(html: string): string | null {
  const raw =
    html.match(/<time[^>]*datetime=["']([^"']+)/i)?.[1] ??
    html.match(/<time[^>]*>([^<]+)<\/time>/i)?.[1];
  if (!raw) return null;
  const d = raw.trim().match(/^(\d{1,2})[./](\d{1,2})[./](20\d{2})$/),
    value = d
      ? `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`
      : raw.trim();
  return Number.isFinite(Date.parse(value)) ? value : null;
}
export type PrimaryArticle = {
  key?: string;
  title: string;
  body: string;
  publishedAt: string | null;
};
/** Dated primary-owned social excerpts are separate records, never one page-wide publication time. */
export function indexArticlesOf(html: string): PrimaryArticle[] {
  return elementBlocks(
    html,
    "div",
    (open) =>
      classHas(open, "jet-listing-grid__item") &&
      /data-post-id=["']\d+["']/.test(open),
  ).flatMap((block) => {
    const id = block.open.match(/data-post-id=["'](\d+)/)?.[1],
      publishedAt = dateOf(block.html);
    const body = elementBlocks(block.html, "div", (open) =>
      classHas(open, "elementor-widget-text-editor"),
    )
      .map((b) => textOf(b.html))
      .join(" ");
    if (!id || !body || !publishedAt) return [];
    return [
      {
        key: `lifecycle-post-${id}`,
        title: body.slice(0, 160),
        body,
        publishedAt,
      },
    ];
  });
}
export function articleOf(html: string, url?: string): PrimaryArticle {
  const fragment = url ? new URL(url).hash.slice(1) : "";
  if (fragment.startsWith("lifecycle-post-"))
    return (
      indexArticlesOf(html).find((a) => a.key === fragment) ?? {
        title: "",
        body: "",
        publishedAt: null,
      }
    );
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  let metadata: { title: string; publishedAt: string | null } | null = null;
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]);
      const list = Array.isArray(data) ? data : (data["@graph"] ?? [data]);
      for (const item of list) {
        if (!/NewsArticle|Article/.test(String(item["@type"] ?? ""))) continue;
        metadata = {
          title: String(item.headline ?? item.Headline ?? ""),
          publishedAt:
            typeof item.datePublished === "string" ? item.datePublished : null,
        };
        if (typeof item.articleBody === "string")
          return { ...metadata, body: textOf(item.articleBody) };
      }
    } catch {}
  }
  // Actual single-post content, not the first teaser/card on a news index.
  const content = elementBlocks(
    html,
    "div",
    (open) =>
      classHas(open, "elementor-widget-theme-post-content") ||
      classHas(open, "entry-content"),
  )
    .map((b) => textOf(b.html))
    .filter(Boolean);
  const articles = elementBlocks(html, "article").filter(
    (b) => !/class=["'][^"']*(?:card|elementor-post|post-card)/i.test(b.open),
  );
  const body =
    content[0] ?? (articles.length === 1 ? textOf(articles[0].html) : "");
  return {
    title:
      metadata?.title ||
      textOf(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? ""),
    body,
    publishedAt:
      metadata?.publishedAt ??
      html.match(
        /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)/i,
      )?.[1] ??
      dateOf(articles.length === 1 ? articles[0].html : ""),
  };
}
