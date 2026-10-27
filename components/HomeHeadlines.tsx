import Link from "next/link";
import { fetchNews } from "@/lib/news";
import { electionVocabulary, groupNews, splitHeadlines } from "@/lib/news-grouping";
import { parties } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { HOME_HEADLINES } from "@/lib/i18n/home-headlines";

const vocabulary = electionVocabulary(parties);
const israel = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/**
 * The newest election headlines beside the hero (Daniel, 2026-10-27): the same feeds, grouping and election filter as
 * /news, cut to the last day and the first few groups. Nothing renders when no election headline came back.
 */
export async function homeHeadlines(lang: Lang, count = 3) {
  const news = await fetchNews({ sinceHours: 24, revalidate: 300 }).catch(() => null);
  if (!news) return null;
  const { election } = splitHeadlines(groupNews(news.items), vocabulary);
  const shown = election.slice(0, count);
  if (!shown.length) return null;
  const t = HOME_HEADLINES[lang], translated = lang !== "en";
  return (
    <section key="hero-news" className="hero-news" aria-labelledby="hero-news-h">
      <header>
        <h2 id="hero-news-h">{t.heading}{translated && <small> {t.inEnglish}</small>}</h2>
        <span className="hn-zone">{t.israelTime}</span>
      </header>
      <ol lang={translated ? "en" : undefined} dir={translated ? "ltr" : undefined}>
        {shown.map(({ item }) => (
          <li key={`${item.url}-${item.published}`}>
            <a href={item.url} target="_blank" rel="noopener">{item.title}</a>
            <span className="hn-meta">
              <b>{item.outlet}</b>
              <time dateTime={item.published} title={t.israelTime}>{israel.format(new Date(item.published))}</time>
            </span>
          </li>
        ))}
      </ol>
      <p className="hn-all"><Link href="/news" hrefLang={translated ? "en" : undefined}>{t.all}</Link></p>
    </section>
  );
}
