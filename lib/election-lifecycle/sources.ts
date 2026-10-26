import registry from "../../data/election-lifecycle-sources.json";
import {
  fingerprint,
  formationEnabled,
  officialEnabled,
  POLLS_CLOSE,
} from "./core";
import { fetchPrimary, healthRecord, sourceRecord } from "./acquisition";
import {
  articleOf,
  indexArticlesOf,
  isTestEnvironment,
  linksOf,
  textOf,
} from "./html";
import { extractEvents, PrimaryExtractionError } from "./extract";
import { mergeEvents } from "./events";
import { revalidationPlan } from "./readiness";
import { officialOptions, OFFICIAL_URLS, parseOfficialSeats } from "./official";
import type {
  Authority,
  LifecycleLedger,
  PoliticalEvent,
  SharedSeatContext,
  SourceHealth,
  SourceRef,
} from "./types";
type RegistrySource = {
  id: string;
  publisher: string;
  authority: Authority;
  index: string;
  hosts: string[];
  partyIds: string[];
};
export async function acquireOfficial(ledger: LifecycleLedger, now: string) {
  const previous = ledger.health.find((h) => h.sourceId === "cec-official");
  if (!officialEnabled() || Date.parse(now) < Date.parse(POLLS_CLOSE))
    return {
      snapshot: null as SharedSeatContext | null,
      health: previous ?? healthRecord("cec-official", "cec", "complete", now),
      capture: null as { source: SourceRef; body: string } | null,
    };
  const acquired = await Promise.all(
    OFFICIAL_URLS.map(async (url) => {
      try {
        const body = await fetchPrimary(url, [
          "cdn-votes26.bechirot.gov.il",
          "votes26.bechirot.gov.il",
        ]);
        return {
          snapshot: parseOfficialSeats(body, officialOptions(now, url)),
          body,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "source_unavailable",
        };
      }
    }),
  );
  const valid = acquired.filter(
    (r): r is { snapshot: SharedSeatContext; body: string } =>
      "snapshot" in r && !!r.snapshot,
  );
  if (new Set(valid.map((r) => r.snapshot.snapshotRevision)).size > 1)
    return {
      snapshot: null,
      health: healthRecord("cec-official", "cec", "disputed", now, previous),
      capture: null,
    };
  if (valid.length) {
    const { snapshot, body } = valid[0],
      last = ledger.seatSnapshots
        .filter((s) => s.basis === "official_seats")
        .at(-1),
      selected =
        last?.snapshotRevision === snapshot.snapshotRevision
          ? last
          : last
            ? {
                ...snapshot,
                correctionOf: last.revision,
                revision: fingerprint({
                  sourceRevision: snapshot.revision,
                  correctionOf: last.revision,
                }),
              }
            : snapshot;
    return {
      snapshot: selected,
      health: healthRecord("cec-official", "cec", "healthy", now, previous),
      capture: { source: snapshot.sourceRefs[0], body },
    };
  }
  const invalid = acquired.some(
    (r) =>
      "error" in r && !/unavailable|fetch|timeout|aborted/i.test(r.error ?? ""),
  );
  return {
    snapshot: null,
    health: healthRecord(
      "cec-official",
      "cec",
      invalid ? "invalid" : "unavailable",
      now,
      previous,
    ),
    capture: null,
  };
}
export async function acquirePoliticalSources(
  ledger: LifecycleLedger,
  now: string,
) {
  if (!formationEnabled())
    return {
      events: ledger.events,
      health: [] as SourceHealth[],
      captures: [] as { source: SourceRef; body: string }[],
      extractionCache: ledger.extractionCache ?? {},
    };
  let extractionBudget = 3;
  const deadline = Date.now() + 40000;
  const htmlCache = new Map<string, Promise<string>>();
  const acquire = (url: string, hosts: string[]) => {
    const canonical = new URL(url);
    canonical.hash = "";
    if (
      canonical.protocol !== "https:" ||
      !hosts.includes(canonical.hostname) ||
      canonical.username ||
      canonical.password ||
      canonical.port
    )
      return Promise.reject(new Error("source_not_allowed"));
    const key = JSON.stringify([canonical.href, hosts.toSorted()]);
    if (!htmlCache.has(key))
      htmlCache.set(key, fetchPrimary(canonical.href, hosts, deadline));
    return htmlCache.get(key)!;
  };
  const extractionCache = { ...(ledger.extractionCache ?? {}) };
  const extractionPending = new Set(ledger.extractionPending ?? []);
  const results = await Promise.all(
    (registry.sources as RegistrySource[]).map(async (source) => {
      const health: SourceHealth[] = [],
        captures: { source: SourceRef; body: string }[] = [],
        events: PoliticalEvent[] = [];
      const known = revalidationPlan(ledger, source.id, now).selected.map(
        (x) => x.ref,
      );
      let discovered: { url: string; title: string }[] = [];
      try {
        const html = await acquire(source.index, source.hosts);
        if (isTestEnvironment(html)) throw new Error("test_environment");
        health.push(
          healthRecord(
            source.id,
            source.authority,
            "healthy",
            now,
            ledger.health.find((h) => h.sourceId === source.id),
          ),
        );
        discovered = linksOf(html, source.index)
          .filter(
            (l) =>
              source.hosts.includes(new URL(l.url).hostname) &&
              /government|coalition|mandate|confidence|recommend|ממשל|קואליצי|מנדט|אמון|המלצ|משא ומתן|הסכם|הארכ|התייעצ/i.test(
                l.title,
              ),
          )
          .slice(0, 3);
        const excerpts = indexArticlesOf(html).filter((a) =>
          /government|coalition|mandate|confidence|recommend|ממשל|קואליצי|מנדט|אמון|המלצ|משא ומתן|הסכם|הארכ|התייעצ/i.test(
            a.body,
          ),
        );
        discovered.unshift(
          ...excerpts
            .slice(0, 3)
            .map((a) => ({ url: source.index + "#" + a.key, title: a.title })),
        );
        const ownArticle = articleOf(html);
        if (ownArticle.body && ownArticle.publishedAt)
          discovered.unshift({ url: source.index, title: ownArticle.title });
      } catch {
        health.push(
          healthRecord(
            source.id,
            source.authority,
            "unavailable",
            now,
            ledger.health.find((h) => h.sourceId === source.id),
          ),
        );
      }
      const urls = [
        ...new Map(
          [
            ...known.map((s) => ({ url: s.url, title: s.title })),
            ...discovered.slice(0, 3),
          ].map((s) => [s.url, s]),
        ).values(),
      ];
      await Promise.all(
        urls.map(async (item) => {
          const id =
            source.id + ":" + Buffer.from(item.url).toString("base64url");
          try {
            const html = await acquire(item.url, source.hosts);
            if (isTestEnvironment(html)) throw new Error("test_environment");
            const article = articleOf(html, item.url);
            if (
              !article.body ||
              /temporarily.*inaccessible|maintenance.page|access.denied|captcha/i.test(
                article.body,
              )
            )
              throw new Error("source_unusable");
            const ref = {
              ...sourceRecord(
                id,
                source.publisher,
                item.url,
                source.authority,
                html,
                now,
                article.title || item.title,
              ),
              publishedAt: article.publishedAt,
              partyIds: source.partyIds,
            };
            if (
              ref.publishedAt &&
              (!Number.isFinite(Date.parse(ref.publishedAt)) ||
                Date.parse(ref.publishedAt) > Date.parse(now))
            )
              throw new Error("invalid_publication_time");
            const prior = ledger.events.filter((e) =>
              e.sources.some((s) => s.id === id),
            );
            for (const old of prior)
              if (
                (old.status === "confirmed" || old.status === "disputed") &&
                !textOf(article.body).includes(old.evidenceQuote)
              )
                events.push({ ...old, status: "retracted" });
            const extractionFingerprint = fingerprint({
              extractorVersion: 4,
              configured: !!process.env.GEMINI_API_KEY,
              body: textOf(article.body),
              publishedAt: ref.publishedAt,
              authority: ref.authority,
              partyIds: ref.partyIds,
            });
            if (
              extractionCache[id] !== extractionFingerprint &&
              extractionBudget > 0
            ) {
              extractionBudget--;
              extractionPending.add(id);
              events.push(
                ...(await extractEvents(
                  ref,
                  article.body,
                  now,
                  ledger.events,
                  deadline,
                )),
              );
              extractionCache[id] = extractionFingerprint;
              extractionPending.delete(id);
            } else if (extractionCache[id] !== extractionFingerprint) {
              extractionPending.add(id);
            }
            health.push(
              healthRecord(
                id,
                source.authority,
                "healthy",
                now,
                ledger.health.find((h) => h.sourceId === id),
              ),
            );
            captures.push({ source: ref, body: html });
          } catch (error) {
            const failed = healthRecord(
              id,
              source.authority,
              "unavailable",
              now,
              ledger.health.find((h) => h.sourceId === id),
            );
            if (error instanceof PrimaryExtractionError)
              failed.diagnostic = {
                stage: "extraction",
                code: error.category,
                httpStatus: error.httpStatus,
                providerStatus: error.providerStatus,
              };
            health.push(failed);
          }
        }),
      );
      return { events, health, captures };
    }),
  );
  const retractions = new Map(
    results
      .flatMap((r) => r.events)
      .filter((e) => e.status === "retracted")
      .map((e) => [e.id, e]),
  );
  const previous = ledger.events.map((e) => retractions.get(e.id) ?? e);
  return {
    events: mergeEvents(
      previous,
      results.flatMap((r) => r.events).filter((e) => e.status !== "retracted"),
    ),
    health: results.flatMap((r) => r.health),
    captures: results.flatMap((r) => r.captures),
    extractionCache,
    extractionPending: [...extractionPending],
  };
}
