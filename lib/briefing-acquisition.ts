import { createHash } from "node:crypto";
import { articleOf } from "./election-lifecycle/html";
import type { NewsItem } from "./news";
import type { CapturedArticle } from "./briefing-verified";
const HOSTS = new Set([
  "timesofisrael.com",
  "www.timesofisrael.com",
  "haaretz.com",
  "www.haaretz.com",
  "jpost.com",
  "www.jpost.com",
  "972mag.com",
  "www.972mag.com",
  "jta.org",
  "www.jta.org",
  "jewishinsider.com",
  "www.jewishinsider.com",
  "forward.com",
  "www.forward.com",
]);
export function reportingOrigin(
  html: string,
  url: string,
): CapturedArticle["origin"] {
  const authors: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    if (/Article/.test(String(object["@type"]))) {
      const by = Array.isArray(object.author) ? object.author : [object.author];
      for (const author of by) {
        if (typeof author === "string") authors.push(author);
        else if (
          author &&
          typeof author === "object" &&
          typeof (author as { name?: unknown }).name === "string"
        )
          authors.push((author as { name: string }).name);
      }
    }
    if (object["@graph"]) walk(object["@graph"]);
  };
  for (const match of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      walk(JSON.parse(match[1]));
    } catch {}
  }
  const byline = authors.join(", ").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!byline) return { id: null, kind: "unknown", byline: null };
  const wires = [
    ["reuters", /reuters/i],
    ["ap", /associated press|\bAP\b/],
    ["afp", /agence france|\bAFP\b/i],
    ["bloomberg", /bloomberg/i],
  ] as const;
  const wire = wires.find(([, pattern]) => pattern.test(byline));
  if (wire) return { id: "wire:" + wire[0], kind: "wire", byline };
  if (/agency|agencies|news service|syndicat/i.test(byline))
    return { id: null, kind: "unknown", byline };
  return {
    id: "newsroom:" + new URL(url).hostname.replace(/^www\./, ""),
    kind: "newsroom",
    byline,
  };
}
export function allowedNewsUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      HOSTS.has(u.hostname) &&
      (!u.port || u.port === "443")
    );
  } catch {
    return false;
  }
}
/** Bounded ordinary redirects only. A challenge/paywall is unavailable, never bypassed. */
export async function captureArticle(
  item: NewsItem,
): Promise<CapturedArticle | null> {
  try {
    let url = item.url;
    let response: Response | undefined;
    const signal = AbortSignal.timeout(10000);
    for (let hop = 0; hop < 4; hop++) {
      if (!allowedNewsUrl(url)) return null;
      response = await fetch(url, {
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": "israelvotes.org public reference reader",
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const target = response.headers.get("location");
        if (!target) return null;
        url = new URL(target, url).href;
        continue;
      }
      break;
    }
    if (
      !response?.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    )
      return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > 1000000) {
        await reader.cancel();
        return null;
      }
      chunks.push(part.value);
    }
    const html = Buffer.concat(chunks).toString("utf8");
    if (
      /just a moment|verify you are human|enable javascript and cookies|access denied|subscribe to continue/i.test(
        html.slice(0, 12000),
      )
    )
      return null;
    const article = articleOf(html, url);
    if (
      article.body.length < 600 ||
      !article.publishedAt ||
      !Number.isFinite(Date.parse(article.publishedAt)) ||
      Math.abs(Date.parse(article.publishedAt) - Date.parse(item.published)) >
        172800000
    )
      return null;
    const body = article.body.slice(0, 16000);
    return {
      ...item,
      url,
      published: article.publishedAt,
      body,
      bodyHash: createHash("sha256").update(body).digest("hex"),
      capturedAt: new Date().toISOString(),
      origin: reportingOrigin(html, url),
    };
  } catch {
    return null;
  }
}
