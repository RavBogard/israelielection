import { isCurrentElectionRef } from "./political-record/elections";
import { getSharedSeatContext } from "./election-lifecycle/server";
import { lifecycleStore } from "./election-lifecycle/store";
import { geographyToElection } from "./geography-view";
import { forecastPoll } from "./forecast";
import { resolveSeatSelection } from "./seat-selection";
import { contextRoleTotals, pinnedSeatHref } from "./seat-context";
import { LIFECYCLE } from "./i18n/election-lifecycle";
import { historicalElections, historicalPlaces } from "./votemap-data";
import {
  averagePoll,
  exitPolls,
  dataUpdated,
  mainPolls,
  parties,
  pledgeRules,
  pollsData,
} from "./data";
import {
  comparisonIssues,
  evidenceLabel,
  isRecord,
  isUnstated,
  stanceText,
} from "./positions";
import {
  arrangement,
  arrangementWarnings,
  restoreRoles,
  roleOf,
  ROLE_LABELS,
} from "./coalition-arrangement";
import { pollLabel } from "./polls";
import { fetchCount, resultsConfig } from "./results-live";
import { resultsAsPoll, RESULTS_ID } from "./results";
import { localityHistory, mapHref, readMapState } from "./locality-history";
import type { SourcedExport } from "./export";
import { localizeExport } from "./export-locale";
import { isLang, locale } from "./i18n";
import { exportMethodText } from "./i18n/export-method";
import builder from "./i18n/builder";
import { partyText, pledgeText, questionText } from "./i18n/overlays";
import { referenceText } from "./i18n/reference";
export async function buildExport(
  kind: string,
  q: URLSearchParams,
): Promise<SourcedExport | null> {
  const model = await buildSourceExport(kind, q);
  return model ? localizeExport(model, kind, q.get("lang")) : null;
}
async function buildSourceExport(
  kind: string,
  q: URLSearchParams,
): Promise<SourcedExport | null> {
  const requestedLang = q.get("lang"),
    lang = requestedLang && isLang(requestedLang) ? requestedLang : "en",
    t = exportMethodText(lang),
    B = builder[lang],
    L = LIFECYCLE[lang];
  const ids = [
    ...new Set(
      (q.get("p") ?? "")
        .split(",")
        .filter((id) => parties.some((p) => p.id === id)),
    ),
  ];
  if (kind === "issue") {
    const issues = comparisonIssues();
    const chosenIssues = q.get("issue")
      ? issues.filter(
          (i) =>
            i.key === q.get("issue") || i.key.startsWith(`${q.get("issue")}-`),
        )
      : issues;
    if (!chosenIssues.length) return null;
    const selected = ids.length
      ? parties.filter((p) => ids.includes(p.id))
      : parties.filter((p) => p.coalitionCard !== "hidden");
    const sources = new Map<string, string>();
    const rows = chosenIssues.flatMap((issue) =>
      selected.map((p) => {
        const row = issue.file.rows.find((r) => r.party === p.id);
        const question = {
          key: issue.key,
          label: issue.label,
          question: issue.file.question ?? issue.file.title,
        };
        if (row?.url && /^https?:\/\//.test(row.url))
          sources.set(row.url, row.source ?? L.source);
        return [
          questionText(question, "label", lang).text,
          questionText(question, "question", lang).text,
          p.name,
          row?.status === "none" || !row?.text
            ? `${t.notEstablished}${row?.text ? `; ${t.sourceContext}: ${row.text}` : ""}`
            : row.declined || row.status === "declined"
              ? t.declined
              : lang !== "en" && isUnstated(row)
                ? `${t.unstated}: ${row.text}`
                : stanceText(row),
          isUnstated(row)
            ? t.unstated
            : isRecord(row)
              ? t.record
              : row?.stance
                ? t.stated
                : t.notApplicable,
          evidenceLabel(row, lang),
          row?.source ?? L.noTime,
          row?.url ?? null,
        ];
      }),
    );
    return {
      title:
        chosenIssues.length === 1
          ? chosenIssues[0].file.title
          : "Selected issue comparison",
      asOf: dataUpdated,
      assumptions:
        lang !== "en"
          ? [
              `${t.selected}: ${selected.map((p) => partyText(p, "name", lang).text).join(", ")}.`,
              t.issueNote,
            ]
          : [
              `Selected lists: ${selected.map((p) => p.name).join(", ")}.`,
              'Recorded answers are evidence, not a forecast. Missing evidence is not a policy position. Basis "Not said publicly" marks a position read from the party\'s record, not from its own statement. Evidence publication dates are shown separately from source checks.',
            ],
      headers: [
        "Issue",
        "Question",
        "List",
        "Recorded answer / status",
        "Basis",
        "Evidence date and check",
        "Source",
        "Source link",
      ],
      rows,
      sources: [...sources].map(([url, label]) => ({ url, label })),
      view: `/compare?${new URLSearchParams({ p: selected.map((p) => p.id).join(",") })}`,
    };
  }
  if (kind === "coalition") {
    if (q.has("context") || !q.has("poll") || q.get("poll") === "current") {
      const selection = await resolveSeatSelection(q);
      if (!selection?.context) return null;
      const c = selection.context,
        ids = Object.keys(c.pointSeats),
        roles = restoreRoles(q, ids),
        vote = contextRoleTotals(c, roles.cabinet, roles.overrides);
      return {
        title: "Selected coalition arrangement",
        asOf: c.publishedAt ?? L.noTime,
        assumptions:
          lang !== "en"
            ? [
                `${L[c.basis]}. ${L[c.seatStatus]}. ${L[c.freshness.status]}. ${referenceText(lang).revision}: ${c.revision}. ${L.checked}: ${c.freshness.checkedAt ?? L.noTime}.`,
                t.unknown,
                B.description,
                B.voteRowNote,
                `${B.cabinetRow}: ${vote.cabinet}. ${B.voteLine(String(vote.yes), String(vote.no), String(vote.abstain))}.`,
              ]
            : [
                `${LIFECYCLE.en[c.basis]} · ${LIFECYCLE.en[c.seatStatus]} · ${LIFECYCLE.en[c.freshness.status]}. Revision ${c.revision}. Checked ${c.freshness.checkedAt ?? "not recorded"}.`,
                "All roles are hypothetical. Unknown lists have no inferred bloc, policy or pledge. More yes than no is required for initial confidence; abstentions can permit passage below 61.",
                `Cabinet ${vote.cabinet}; yes ${vote.yes}; no ${vote.no}; abstain ${vote.abstain}.`,
              ],
        headers: ["List", "Assigned role", "Seats"],
        rows: ids.map((id) => [
          parties.find((p) => p.id === id)?.name ??
            c.parties.find((p) => p.id === id)?.label ??
            id,
          ROLE_LABELS[roleOf(id, roles.cabinet, roles.overrides)],
          c.pointSeats[id],
        ]),
        sources: c.sourceRefs.map((source) => ({
          label: source.publisher + ": " + source.title,
          url: source.url,
        })),
        view: pinnedSeatHref(`/coalition-builder?${q}`, c),
      };
    }
    const roles = restoreRoles(
      q,
      parties.map((p) => p.id),
    );
    const requested = q.get("poll") ?? averagePoll.id;
    let poll = [forecastPoll, averagePoll, ...exitPolls, ...mainPolls].find(
      (p) => p.id === requested,
    );
    const assumptions: string[] = [];
    if (requested === RESULTS_ID) {
      const live = await fetchCount();
      if (live.state !== "open")
        return {
          title: "Coalition arrangement — count unavailable",
          asOf: resultsConfig.election,
          assumptions: [t.countUnavailable],
          headers: ["List", "Assigned role"],
          rows: parties.map((p) => [
            p.name,
            ROLE_LABELS[roleOf(p.id, roles.cabinet, roles.overrides)],
          ]),
          sources: [
            {
              label: resultsConfig.source.label,
              url: resultsConfig.source.url,
            },
          ],
          view: `/coalition-builder?${q}`,
        };
      poll = resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live);
      assumptions.push(
        lang === "en"
          ? `Count ${live.freshness}; captured ${live.fetchedAt}. Source update: ${live.sourceUpdatedAt ?? "not provided"}. Estimated seats, not official allocation.`
          : `${L.partial_count}. ${L[live.freshness === "fresh" ? "current" : "stale"]}. ${t.captured}: ${live.fetchedAt}. ${t.sourceUpdate}: ${live.sourceUpdatedAt ?? L.noTime}. ${t.countNote}`,
      );
    }
    if (!poll) return null;
    const vote = arrangement(roles.cabinet, roles.overrides, parties, poll);
    const averaged = poll.id === averagePoll.id;
    if (lang !== "en")
      assumptions.push(
        `${t.basis}: ${averaged ? B.averagePhrase(mainPolls.length) : poll.id === forecastPoll.id ? L.campaign_forecast : poll.pollster}. ${poll.published}.`,
        t.unknown,
        B.description,
        B.voteRowNote,
        `${B.cabinetRow}: ${vote.cabinet}. ${vote.complete ? B.voteLabel(B.voteLine(String(vote.yes), String(vote.no), String(vote.abstain)), B.verdict[vote.outcome === "passes" ? "passes" : "fails"]) : B.voteLabel(B.voteLine(String(vote.yes), String(vote.no), String(vote.abstain)), B.verdict.none)}`,
      );
    else
      assumptions.push(
        `Selected seat basis: ${averaged ? "Normalized coalition average" : pollLabel(poll)}, ${poll.published}.`,
        "Every assigned role is hypothetical. Cabinet membership, outside support and abstention are distinct. An initial confidence vote requires more for than against; 61 seats is the absolute-majority planning target.",
        `Cabinet ${vote.cabinet}; votes for ${vote.yes}, against ${vote.no}, hypothetical abstention ${vote.abstain}. ${vote.complete ? `Arithmetic outcome: ${vote.outcome}.` : "Coverage or rounded totals are incomplete; no confidence outcome inferred."}`,
      );
    if (vote.approximate)
      assumptions.push(
        lang === "en"
          ? "Fractional averages illustrate support; real MKs cast whole votes. This hypothetical arithmetic is not a prediction of a parliamentary vote."
          : B.approximate,
      );
    for (const warning of arrangementWarnings(
      roles.cabinet,
      roles.overrides,
      parties,
      pledgeRules,
      lang === "en"
        ? undefined
        : {
            message: (r) => pledgeText(r, lang),
            name: (p) => partyText(p, "name", lang).text,
            and: (names) =>
              new Intl.ListFormat(locale(lang), { type: "conjunction" }).format(
                names,
              ),
          },
    ))
      assumptions.push(
        lang === "en"
          ? `Recorded ${warning.kind}: ${warning.message} Source: ${warning.source}`
          : `${t.recorded}: ${warning.message} ${L.source}: ${warning.source}`,
      );
    if (averaged) {
      if (lang !== "en")
        assumptions.push(
          `${t.window}: ${pollsData.config.currentWindowDays}. ${t.averageNote}`,
          `${t.inputs}: ${mainPolls.map((p) => `${p.pollster} ${p.published} (n ${p.n ?? L.noTime})`).join("; ")}.`,
        );
      else
        assumptions.push(
          `${pollsData.config.currentWindowDays}-day publication window; one latest poll per publisher; square-root sample-size weights, median n when absent; passing-only means; near-threshold lists excluded and sum scaled down only if over 120.`,
          `Inputs: ${mainPolls.map((p) => `${p.pollster} ${p.published} (n ${p.n ?? "not recorded"})`).join("; ")}.`,
        );
    }
    return {
      title: "Selected coalition arrangement",
      asOf: poll.resultState?.capturedAt ?? poll.published,
      assumptions,
      headers: ["List", "Assigned role", "Seats / coverage"],
      rows: parties.map((p) => [
        p.name,
        ROLE_LABELS[roleOf(p.id, roles.cabinet, roles.overrides)],
        poll.results[p.id]?.seats ??
          (poll.combined.find((g) => g.parties.includes(p.id))
            ? t.combined
            : t.notReported),
      ]),
      sources: [
        ...(averaged ? mainPolls : [poll])
          .filter((p) => p.url && /^https?:\/\//.test(p.url))
          .map((p) => ({
            label: `${p.pollster}, ${p.published}`,
            url: p.url!,
          })),
        {
          label:
            lang === "en"
              ? "Initial confidence: Basic Law, The Government"
              : B.lawLinks[0].text,
          url: "https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf",
        },
        {
          label:
            lang === "en"
              ? "Polling average method"
              : B.averagePhrase(mainPolls.length),
          url: "https://www.israelielection.org/polls#method",
        },
      ],
      view: `/coalition-builder?${q}`,
    };
  }
  if (kind === "locality") {
    let elections = historicalElections;
    const places = historicalPlaces;
    let selectedGeographyRevision: string | null = null;
    if (isCurrentElectionRef(q.get("election"))) {
      const revision = q.get("geography") ?? undefined;
      if (revision && !/^[a-f0-9]{64}$/.test(revision)) return null;
      try {
        const snapshot = await lifecycleStore()?.geography(revision);
        const selected = snapshot?.officialSeatRevision
          ? await getSharedSeatContext({
              revision: snapshot.officialSeatRevision,
            })
          : null;
        const current = snapshot
          ? geographyToElection(
              snapshot,
              selected?.state === "ready" ? selected.context : null,
            )
          : null;
        if (!current) return null;
        elections = [...historicalElections, current];
        selectedGeographyRevision = snapshot!.revision;
      } catch {
        return null;
      }
    }
    const state = readMapState(q, places);
    if (state.locality === null) return null;
    const election = elections.find((e) => e.id === state.election)!;
    const selected = readMapState(q, places, election);
    const history = localityHistory(elections, state.locality);
    return {
      title: `${places[state.locality][0]}: locality voting history`,
      asOf:
        lang !== "en"
          ? `${elections[0].date} → ${elections.at(-1)!.date}. ${t.files}: ${[...new Set(elections.map((e) => e.source.fetched))].sort().join(", ")}`
          : `${elections[0].date} through ${elections.at(-1)!.date}; source files fetched ${[...new Set(elections.map((e) => e.source.fetched))].sort().join(", ")}`,
      assumptions:
        lang !== "en"
          ? [
              ...(selectedGeographyRevision
                ? [`${t.geography}: ${selectedGeographyRevision}.`]
                : []),
              `${t.observation}: ${election.label}, ${selected.list}. ${t.locality}: ${state.locality}. ${t[state.mode]}.`,
              t.listIdentity,
              t.mapNote,
            ]
          : [
              ...(selectedGeographyRevision
                ? [`Geography snapshot revision: ${selectedGeographyRevision}.`]
                : []),
              `Selected observation: ${election.label}, ${selected.list}; locality code ${state.locality}; map view ${{ single: "one list’s vote share", mix: "vote mix", leader: "leading list" }[state.mode]}.`,
              `Election-specific lists retain original names and ballot letters. Ballot letters do not identify the same political party across elections.`,
              "Shares use valid local votes; turnout is voted / eligible. Missing rows or denominators are unavailable, not zero. Special envelopes have no locality and are excluded. Aggregate changes cannot establish individual voter migration; population, eligibility and boundaries can change.",
            ],
      headers: [
        "Election",
        "List",
        "Letters",
        "Votes",
        "Share of valid votes (%)",
        "Eligible",
        "Voted",
        "Valid",
        "Turnout (%)",
      ],
      rows: history.flatMap(({ election: e, row, turnout, lists }) =>
        !row
          ? [[e.label, t.noRow, null, null, null, null, null, null, null]]
          : [
              ...lists.map((l) => [
                e.label,
                l.name,
                l.letters,
                l.votes,
                l.share === null ? null : (l.share * 100).toFixed(2),
                row[1],
                row[2],
                row[3],
                turnout === null ? null : (turnout * 100).toFixed(2),
              ]),
              [
                e.label,
                t.other,
                null,
                row[3] - lists.reduce((n, l) => n + l.votes, 0),
                row[3] > 0
                  ? (
                      ((row[3] - lists.reduce((n, l) => n + l.votes, 0)) /
                        row[3]) *
                      100
                    ).toFixed(2)
                  : null,
                row[1],
                row[2],
                row[3],
                turnout === null ? null : (turnout * 100).toFixed(2),
              ],
            ],
      ),
      sources: elections.map((e) => ({
        label:
          lang === "en"
            ? `CEC ${e.label}, fetched ${e.source.fetched}`
            : `CEC ${e.label}. ${L.checked}: ${e.source.fetched}`,
        url: e.source.csv,
      })),
      view:
        mapHref(state.election, selected.list, state.locality, state.mode) +
        (selectedGeographyRevision
          ? `&geography=${encodeURIComponent(selectedGeographyRevision)}`
          : ""),
    };
  }
  return null;
}
