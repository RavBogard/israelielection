import { describe, expect, it } from "vitest";
import { checkDraft } from "./briefing";
import { parseFeed, toText, type NewsItem } from "./news";

const items: NewsItem[] = [
  { outlet: "Times of Israel", title: "Eisenkot challenges Netanyahu to a televised debate before national election", url: "https://www.timesofisrael.com/a", published: "2026-10-04T23:56:56.000Z", summary: "Yashar party says leadership candidates owe the public a direct debate" },
  { outlet: "Haaretz", title: "Israel gas price to drop following Smotrich pre-election push", url: "https://www.haaretz.com/b", published: "2026-10-04T19:03:43.000Z", summary: "A tax cut set to lower prices comes just weeks before the election" },
  { outlet: "Jerusalem Post", title: "High Court rejects Democrats' bid to bar Otzma Yehudit from election", url: "https://www.jpost.com/c", published: "2026-10-04T16:46:00.000Z", summary: "" },
];
const meta = { date: "2026-10-05", model: "gemini-3.8-flash" };

describe("checkDraft", () => {
  it("publishes grounded sentences with resolved sources", () => {
    const { briefing, problems } = checkDraft({ sentences: [
      { text: "Gadi Eisenkot challenged Benjamin Netanyahu to a televised debate before the election.", sources: [1] },
      { text: "Gas prices are set to drop after a tax cut pushed by Finance Minister Smotrich.", sources: [2] },
      { text: "The High Court rejected a bid by the Democrats to bar Otzma Yehudit from running.", sources: [3] },
    ] }, items, meta);
    expect(problems).toEqual([]);
    expect(briefing!.sentences.map((s) => s.sources[0].outlet)).toEqual(["Times of Israel", "Haaretz", "Jerusalem Post"]);
  });

  it("drops sentences with bad citations, links, or no overlap, and refuses a thin briefing", () => {
    const { briefing, problems } = checkDraft({ sentences: [
      { text: "Gadi Eisenkot challenged Netanyahu to a televised debate.", sources: [1] },
      { text: "Lapid announced he is leaving politics.", sources: [2] },
      { text: "The court ruled on Otzma Yehudit.", sources: [9] },
      { text: "See https://example.com for High Court Otzma Yehudit news.", sources: [3] },
    ] }, items, meta);
    expect(briefing).toBeNull();
    expect(problems[0]).toMatch(/Only 1 sentences/);
  });
});

describe("feeds", () => {
  it("parses RSS items, decodes entities, and filters general feeds to Israel", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item><title>Netanyahu &amp; Eisenkot spar</title><link>https://x.example/1</link><pubDate>Sun, 04 Oct 2026 23:56:56 +0000</pubDate><description><![CDATA[<p>Debate &#8216;now&#8217;</p>]]></description></item>
      <item><title>Country star wears shirt</title><link>https://x.example/2</link><pubDate>Sun, 04 Oct 2026 20:00:00 +0000</pubDate></item>
      <item><title>Bad link</title><link>javascript:alert(1)</link><pubDate>Sun, 04 Oct 2026 20:00:00 +0000</pubDate></item>
    </channel></rss>`;
    const got = parseFeed(xml, { outlet: "Test", url: "", filter: true });
    expect(got.map((i) => i.title)).toEqual(["Netanyahu & Eisenkot spar"]);
    expect(got[0].summary).toBe("Debate ‘now’");
    expect(toText("<b>a</b>&nbsp;b")).toBe("a b");
  });

  it("unwraps Bing News links and keeps only the outlet's own site", () => {
    const wrap = (u: string) => `http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;url=${encodeURIComponent(u)}&amp;mkt=en-us`;
    const xml = `<rss><channel>
      <item><title>Knesset votes</title><link>${wrap("https://www.timesofisrael.com/knesset-votes/")}</link><pubDate>Sun, 04 Oct 2026 17:00:00 GMT</pubDate></item>
      <item><title>Israel elsewhere</title><link>${wrap("https://elsewhere.example/israel")}</link><pubDate>Sun, 04 Oct 2026 17:00:00 GMT</pubDate></item>
    </channel></rss>`;
    const got = parseFeed(xml, { outlet: "Times of Israel", url: "", filter: true }, { host: "timesofisrael.com" });
    expect(got.map((i) => i.url)).toEqual(["https://www.timesofisrael.com/knesset-votes/"]);
  });
});
