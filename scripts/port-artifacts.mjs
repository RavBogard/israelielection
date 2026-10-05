// One-off port (2026-10-04): reads the Coalition Builder v2 artifact and writes
// data/parties.json and data/polls.json. Kept for provenance; the JSON files are
// now the source of truth and this script should not be re-run over edited data.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("docs/artifacts/coalition-builder-v2.html", "utf8");
const js = html.split("<script>")[1].split("PROFILES.forEach")[0];
const ctx = {};
vm.runInNewContext(js + ";this.out={POLLS,BLOCS,PARTIES,PROFILES,ISSUE_LABELS,KAN_SHAS_UTJ};", ctx);
const { POLLS, BLOCS, PARTIES, PROFILES, ISSUE_LABELS, KAN_SHAS_UTJ } = ctx.out;

const item = ([text, source]) => ({ text, source: source ?? null });
const TAGS = (c) => [c?.haredi && "haredi", c?.arab && "arab", c?.zionistOpp && "zionistOpp"].filter(Boolean);

const parties = PROFILES.map((p) => {
  const c = PARTIES.find((q) => q.id === p.id);
  return {
    id: p.id,
    name: p.name,
    leader: p.leader,
    bloc: p.bloc,
    tags: TAGS(c),
    status: p.off ?? null,
    coalitionCard: !c ? "hidden" : c.out ? "out" : "active",
    surplusLine: c?.sp ?? null,
    who: p.who.map(item),
    thin: p.thin ?? null,
    voters: p.voters ? p.voters.map(item) : null,
    issues: p.issues
      ? Object.fromEntries(ISSUE_LABELS.map(([k]) => [k, p.issues[k] ? item(p.issues[k]) : null]))
      : null,
    names: p.names ? p.names.map(([slot, name, note]) => ({ slot, name, note: note || null })) : null,
    namesSource: p.namesSrc ?? null,
    pledges: p.pledges ? p.pledges.map(item) : null,
    surplusPartner: p.partner ? item(p.partner) : null,
    quote: p.quote ? { text: p.quote[0], speaker: p.quote[1], source: p.quote[2] } : null,
    bios: p.bio ? p.bio.map(([name, text]) => ({ name, text })) : null,
  };
});

writeFileSync(
  "data/parties.json",
  JSON.stringify(
    {
      updated: "2026-10-04",
      provenance:
        "CRC party registers 11a–11d (docs/class-11*.md), compiled Oct 4, 2026; ported from Coalition Builder v2 / Party Map v2.",
      bioSource: "Wikipedia, accessed Oct 2026, via the research memo and party registers.",
      blocs: ["net", "opp", "mid", "arab"].map((id) => ({ id, label: BLOCS[id].label })),
      issues: ISSUE_LABELS.map(([key, label]) => ({ key, label })),
      parties,
    },
    null,
    2
  ) + "\n"
);

// Polls: four in the averages, plus Channel 14 (shown, not averaged).
const META = {
  maariv: { pollster: "Maariv", firm: "Lazar", fieldwork: "Sep 30–Oct 1, 2026", published: "2026-10-02",
    via: "Jerusalem Post", url: "https://www.jpost.com/israel-election-2026/article-910396", n: null, margin: null, note: null },
  c13: { pollster: "Channel 13", firm: null, fieldwork: null, published: "2026-10-01",
    via: "Times of Israel liveblog", url: null, n: 1013, margin: null, note: "Reservists–Economic polled below the threshold." },
  zman: { pollster: "Zman Yisrael", firm: "Tatika", fieldwork: null, published: "2026-10-01",
    via: null, url: null, n: 500, margin: "±4.4", note: null },
  kan: { pollster: "Kan 11", firm: null, fieldwork: null, published: "2026-09-28",
    via: "Jerusalem Post", url: "https://jpost.com/israel-election-2026/article-909918", n: null, margin: null,
    note: "Kan did not report Shas or UTJ separately. The listed parties add up to 106, so Shas and UTJ together hold 14 (our arithmetic: 120 − 106)." },
};
const polls = POLLS.map((pl, i) => {
  const results = {};
  for (const p of PARTIES) {
    if (!p.s) continue;
    const v = p.s[i];
    if (v === null) continue;
    results[p.id] = p.below?.[i] ? { seats: 0, belowThreshold: true } : { seats: v };
  }
  return {
    id: pl.id, ...META[pl.id], inAverage: true, results,
    combined: pl.id === "kan" ? [{ parties: ["shas", "utj"], seats: KAN_SHAS_UTJ, note: "120 minus the 106 seats Kan listed for everyone else" }] : [],
  };
});
const c14 = {};
for (const p of PROFILES) {
  if (!p.c14) continue;
  const r = p.c14.below ? { seats: 0, belowThreshold: true, pct: p.c14.pct } : { seats: p.c14.v };
  if (!p.c14.d) r.dateUncertain = true;
  c14[p.id] = r;
}
polls.push({
  id: "c14", pollster: "Channel 14", firm: "Next Data / Filber", fieldwork: null, published: "2026-10-01",
  via: "skarim.org", url: null, n: null, margin: null, inAverage: false, results: c14, combined: [],
  note: "Left out of averages and the coalition count: runs well above other polls for Likud (31–32 vs 19–21). Sep 23 and Sep 28 polls also cited; figures marked date-uncertain are the latest in our register without a date.",
});
writeFileSync("data/polls.json", JSON.stringify({ updated: "2026-10-04", polls }, null, 2) + "\n");
console.log(parties.length, "parties;", polls.length, "polls");
