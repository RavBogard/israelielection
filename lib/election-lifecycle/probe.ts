import registry from "../../data/election-lifecycle-sources.json";
import {
  fetchPrimary,
  fetchPrimaryDetailed,
  PrimaryAcquisitionError,
} from "./acquisition";
import { articleOf, indexArticlesOf, isTestEnvironment, linksOf } from "./html";
import { OFFICIAL_URLS, officialOptions, parseOfficialSeats } from "./official";
/** Signed diagnostic only: fixed primary sources, no extraction model, no writes or raw text in response. */
export async function probeLifecycleSources(now = new Date().toISOString()) {
  const checks = [
    ...registry.sources.map((s) => ({
      id: s.id,
      url: s.index,
      hosts: s.hosts,
    })),
    ...OFFICIAL_URLS.map((url) => ({
      id: "cec-current",
      url,
      hosts: [new URL(url).hostname],
    })),
    {
      id: "cec-historical",
      url: "https://votes25.bechirot.gov.il/nationalresults",
      hosts: ["votes25.bechirot.gov.il"],
    },
  ];
  return Promise.all(
    checks.map(async (c) => {
      try {
        const response = await fetchPrimaryDetailed(c.url, c.hosts),
          html = response.body,
          article = articleOf(html),
          excerpts = indexArticlesOf(html),
          testEnvironment = isTestEnvironment(html);
        let parserAccepted = false,
          parserReason: string | null = null;
        if (c.id.startsWith("cec-"))
          try {
            parseOfficialSeats(
              html,
              c.id === "cec-historical"
                ? {
                    election: "2022-11-01",
                    knesset: 25,
                    dateMarkers: ["1 בנובמבר 2022"],
                    now,
                    url: c.url,
                    letters: {},
                  }
                : officialOptions(now, c.url),
            );
            parserAccepted = true;
          } catch (error) {
            parserReason =
              error instanceof Error ? error.message : "invalid_schema";
          }
        const discovered = linksOf(html, c.url)
          .filter(
            (l) =>
              c.hosts.includes(new URL(l.url).hostname) &&
              /government|coalition|mandate|ממשל|קואליצי|מנדט|הסכם/i.test(
                l.title,
              ),
          )
          .slice(0, 1);
        let sampleArticle: {
          available: boolean;
          bodyCharacters: number;
          hasPublicationTime: boolean;
        } | null = null;
        if (discovered[0])
          try {
            const sample = articleOf(
              await fetchPrimary(discovered[0].url, c.hosts),
            );
            sampleArticle = {
              available: !!sample.body,
              bodyCharacters: sample.body.length,
              hasPublicationTime: !!sample.publishedAt,
            };
          } catch {
            sampleArticle = {
              available: false,
              bodyCharacters: 0,
              hasPublicationTime: false,
            };
          }
        return {
          id: c.id,
          url: c.url,
          available: true,
          testEnvironment,
          bodyCharacters: article.body.length,
          hasPublicationTime: !!article.publishedAt,
          discoveredArticle: !!discovered.length,
          sampleArticle,
          parserAccepted,
          parserReason,
          bytes: html.length,
          resolvedUrl: response.url,
          redirects: response.redirects,
          datedExcerptCount: excerpts.length,
          excerptCharacters: excerpts.reduce((n, a) => n + a.body.length, 0),
        };
      } catch (error) {
        return {
          reason:
            error instanceof PrimaryAcquisitionError
              ? error.code
              : "fetch_failed",
          httpStatus:
            error instanceof PrimaryAcquisitionError ? error.status : null,
          resolvedUrl:
            error instanceof PrimaryAcquisitionError ? error.sourceUrl : null,
          id: c.id,
          url: c.url,
          available: false,
          parserAccepted: false,
        };
      }
    }),
  );
}
