import { NextResponse, type NextRequest } from "next/server";
import { editionPath } from "@/lib/i18n";
import { defaultLang, LANG_COOKIE } from "@/lib/i18n/default-lang";

/**
 * Sends a visitor to the Hebrew edition when they are in Israel or their browser puts Hebrew first, unless they
 * chose English on the toggle (lib/i18n/default-lang.ts has the rule). Runs only on the English pages that have
 * a Hebrew edition (HE_PATHS in lib/i18n; proxy.test.ts keeps the matcher in step), and only for a page load:
 * the router's own fetches, prefetches and HEAD requests pass straight through.
 */
export function proxy(request: NextRequest) {
  // A deliberate original-source link must work even when a translated edition is preferred.
  if(request.nextUrl.searchParams.get("original")==="en")return;
  if (request.method !== "GET") return;
  const h = request.headers;
  if (h.has("rsc") || h.has("next-router-prefetch") || h.get("purpose") === "prefetch") return;
  const dest = h.get("sec-fetch-dest");
  if (dest && dest !== "document") return;
  const lang = defaultLang({
    cookie: request.cookies.get(LANG_COOKIE)?.value,
    country: h.get("x-vercel-ip-country"),
    acceptLanguage: h.get("accept-language"),
    userAgent: h.get("user-agent"),
    referer: h.get("referer"),
    origin: request.nextUrl.origin,
  });
  const to = lang && lang !== "en" ? editionPath(request.nextUrl.pathname, lang) : null;
  if (!to) return;
  const url = request.nextUrl.clone();
  url.pathname = to;
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/", "/polls", "/forecast", "/coalition-builder", "/compare", "/parties/:id", "/results", "/government", "/elections", "/elections/:id", "/parliament", "/policies", "/policies/:id", "/changes", "/reference", "/issues", "/issues/:slug", "/communities", "/communities/:slug", "/how-it-works", "/how-it-works/:slug", "/about", "/american-lens", "/news", "/news/:date", "/subscriptions", "/subscriptions/confirm", "/subscriptions/preferences", "/subscriptions/unsubscribe"],
};
